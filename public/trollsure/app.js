const state = { mode: 'bff', latestQuote: null, latestEnrollment: null, latestGroupId: null, claimEnrollment: null, latestClaim: null, activeAgentId: 'A-101' };
const $ = id => document.getElementById(id);
const archSummary = {
  bff: 'The UI sends one purpose-built REST request. The BFF orchestrates the domain APIs.',
  graphql: 'The UI sends one GraphQL operation. Resolvers orchestrate the same domain REST APIs.'
};

document.querySelectorAll('.arch-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.arch-btn').forEach(x => x.classList.remove('active'));
  btn.classList.add('active'); state.mode = btn.dataset.mode; $('archSummary').textContent = archSummary[state.mode];
}));
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));
function showView(view) {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.view === view));
  document.querySelectorAll('.view').forEach(x => x.classList.toggle('active', x.id === `view-${view}`));
  if (view === 'groups') loadGroups();
  if (view === 'rates') loadRates();
  if (view === 'claims') renderClaimForm();
  if (view === 'agents') loadAgentPortal();
}

$('memberCount').addEventListener('change', renderMembers);
$('sampleBtn').addEventListener('click', () => {
  $('groupName').value='Fellowship of Questionable Decisions'; $('agentId').value='A-101'; $('location').value='LOWER_LANDS'; $('memberCount').value=4; $('planCode').value='IRON'; $('guildContributionPct').value='60'; $('waitingPeriodDays').value='30';
  renderMembers([
    {name:'Aragorn-ish',dependents:0,eligibilityClass:'GUILDMASTER',election:'ENROLL',orcLiverUse:false},
    {name:'Gimli-ish',dependents:2,eligibilityClass:'FULL_TIME',election:'ENROLL',orcLiverUse:true},
    {name:'Legolas-ish',dependents:1,eligibilityClass:'FULL_TIME',election:'WAIVE',orcLiverUse:false},
    {name:'Definitely Not A Goblin',dependents:0,eligibilityClass:'SEASONAL',election:'ENROLL',orcLiverUse:false}
  ]);
});
$('quoteBtn').addEventListener('click', createQuote);
$('refreshGroups').addEventListener('click', loadGroups);
$('claimMember').addEventListener('change', syncClaimProducts);
$('claimBtn').addEventListener('click', submitClaim);
$('agentSelect').addEventListener('change', e => { state.activeAgentId=e.target.value; loadAgentPortal(); });

function renderMembers(seed = null) {
  const count = Math.max(1, Math.min(30, Number($('memberCount').value || 1)));
  $('memberCount').value = count;
  const current = [...document.querySelectorAll('.member-row')].map(row => ({
    name: row.querySelector('.member-name').value,
    dependents: Number(row.querySelector('.dependents').value),
    eligibilityClass: row.querySelector('.eligibility').value,
    election: row.querySelector('.election').value,
    orcLiverUse: row.querySelector('.liver').checked
  }));
  const values = seed || current;
  $('members').innerHTML = '';
  for (let i=0;i<count;i++) {
    const value = values[i] || {name:`Adventurer ${i+1}`,dependents:0,eligibilityClass:'FULL_TIME',election:'ENROLL',orcLiverUse:false};
    const row = document.createElement('div'); row.className='member-row';
    row.innerHTML = `
      <label>Name<input class="member-name" value="${escapeHtml(value.name)}"></label>
      <label>Dependents<input class="dependents" type="number" min="0" max="12" value="${value.dependents}"></label>
      <label>Eligibility<select class="eligibility"><option value="GUILDMASTER">Guild Master</option><option value="FULL_TIME">Full-Time Adventurer</option><option value="APPRENTICE">Apprentice</option><option value="SEASONAL">Seasonal Mercenary</option></select></label>
      <label>Election<select class="election"><option value="ENROLL">Enroll</option><option value="WAIVE">Waive</option></select></label>
      <label class="checkline"><input class="liver" type="checkbox" ${value.orcLiverUse?'checked':''}> Orc Liver Use</label>`;
    row.querySelector('.eligibility').value = value.eligibilityClass || 'FULL_TIME';
    row.querySelector('.election').value = value.election || 'ENROLL';
    $('members').appendChild(row);
  }
}

function collectInput() {
  const members = [...document.querySelectorAll('.member-row')].map((row,i)=>({
    id:`M-${i+1}`,
    name:row.querySelector('.member-name').value.trim() || `Adventurer ${i+1}`,
    dependents:Number(row.querySelector('.dependents').value||0),
    eligibilityClass:row.querySelector('.eligibility').value,
    election:row.querySelector('.election').value,
    orcLiverUse:row.querySelector('.liver').checked
  }));
  const products = [...document.querySelectorAll('.coverage-card input:checked')].map(x=>x.value);
  return {
    groupName:$('groupName').value.trim()||'Unnamed Party', agentId:$('agentId').value, location:$('location').value, members, products,
    planCode:$('planCode').value, guildContributionPct:Number($('guildContributionPct').value), waitingPeriodDays:Number($('waitingPeriodDays').value)
  };
}

async function createQuote() {
  const input = collectInput(); $('quoteBtn').disabled=true; $('quoteBtn').textContent='Calculating…';
  try {
    let payload, consumer;
    if (state.mode === 'bff') {
      consumer = `POST /api/troll/bff/quote\n\n${JSON.stringify(input,null,2)}`;
      payload = await fetchJson('/api/troll/bff/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});
    } else {
      const query = `mutation CreateQuote($input: QuoteInput!) {\n  createTrollQuote(input: $input) {\n    quote { id groupId groupName location groupClass memberCount eligibleMemberCount dependentCount locationAdjustmentPct largeGroupDiscountPct orcLiverUseAdjustmentPct guildContributionPct waitingPeriodDays effectiveDate expiresAt status grossPremium guildContribution adventurerContribution monthlyPremium plan { code name deductible battleCostSharePct maxQuestBurden } products { code name kind deductible } memberLines { memberId name dependents tier eligibilityClass eligibilityName eligible election orcLiverUse grossPremium guildContribution adventurerContribution coverage { code name deductible baseRate adjustedRate } } }\n    trace\n    backendCallCount\n  }\n}`;
      consumer = `${query}\n\nvariables:\n${JSON.stringify({input},null,2)}`;
      const result = await fetchJson('/troll-graphql',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query,variables:{input}})});
      if (result.errors) throw new Error(result.errors[0].message); payload = result.data.createTrollQuote;
    }
    state.latestQuote=payload.quote; state.latestGroupId=payload.quote.groupId;
    renderQuote(payload.quote); renderEnrollment(); renderTrace(consumer,payload.trace,payload.backendCallCount);
  } catch (e) { alert(e.message); }
  finally { $('quoteBtn').disabled=false; $('quoteBtn').textContent='Calculate Quote'; }
}

function renderQuote(q) {
  $('quoteEmpty').classList.add('hidden'); $('quoteResult').classList.remove('hidden');
  $('quoteResult').innerHTML = `
    <div class="quote-hero"><div><div class="status">${q.id} · ${q.status} · ${q.groupClass} GROUP</div><strong>${escapeHtml(q.groupName)}</strong></div><div class="price">${coins(q.grossPremium)} <small>/mo</small></div></div>
    <div class="plan-banner"><div><span>Selected plan</span><strong>${q.plan.name}</strong></div><div><span>Deductible</span><strong>${coins(q.plan.deductible)}</strong></div><div><span>Battle Cost Share</span><strong>${q.plan.battleCostSharePct}%</strong></div><div><span>Max Quest Burden</span><strong>${coins(q.plan.maxQuestBurden)}</strong></div></div>
    <div class="metric-grid">
      <div class="metric"><span>Location</span><strong>${pretty(q.location)} ${q.locationAdjustmentPct?`(+${q.locationAdjustmentPct}%)`:''}</strong></div>
      <div class="metric"><span>Eligible group size</span><strong>${q.eligibleMemberCount} eligible ${q.largeGroupDiscountPct?`(−${q.largeGroupDiscountPct}%)`:''}</strong></div>
      <div class="metric"><span>Effective date</span><strong>${q.effectiveDate}</strong></div>
      <div class="metric"><span>Quote expires</span><strong>${q.expiresAt}</strong></div>
    </div>
    <div class="contribution-grid">
      <div><span>Gross guild premium</span><strong>${coins(q.grossPremium)}</strong></div>
      <div><span>Guild contribution (${q.guildContributionPct}%)</span><strong>${coins(q.guildContribution)}</strong></div>
      <div><span>Adventurer contribution</span><strong>${coins(q.adventurerContribution)}</strong></div>
    </div>
    <div class="member-breakdown">${q.memberLines.map(m=>`<article><div class="line-main"><strong>${escapeHtml(m.name)}</strong><span class="status ${m.election!=='ENROLL'?'dim':''}">${m.election}</span><strong>${coins(m.grossPremium)}</strong></div><div class="mini">${m.eligibilityName} · ${prettyTier(m.tier)}${m.orcLiverUse?' · Orc Liver Use':''}${m.election==='ENROLL'?` · Guild ${coins(m.guildContribution)} · Adventurer ${coins(m.adventurerContribution)}`:''}</div>${m.election==='ENROLL'?`<div class="mini">${m.coverage.map(c=>`${c.name}: ${coins(c.adjustedRate)}`).join(' · ')}</div>`:''}</article>`).join('')}</div>
    <button class="primary full" id="goEnroll">Review Enrollment</button>`;
  $('goEnroll').onclick=()=>showView('enroll');
}

function renderEnrollment() {
  const q=state.latestQuote; if(!q)return;
  $('enrollEmpty').classList.add('hidden'); $('enrollContent').classList.remove('hidden');
  $('enrollContent').innerHTML=`
    <div class="enroll-summary">
      <div class="metric-grid"><div class="metric"><span>Party</span><strong>${escapeHtml(q.groupName)}</strong></div><div class="metric"><span>Quote status</span><strong>${q.status}</strong></div><div class="metric"><span>Plan</span><strong>${q.plan.name}</strong></div><div class="metric"><span>Effective</span><strong>${q.effectiveDate}</strong></div></div>
      <div class="contribution-grid"><div><span>Gross premium</span><strong>${coins(q.grossPremium)}</strong></div><div><span>Guild pays</span><strong>${coins(q.guildContribution)}</strong></div><div><span>Adventurers pay</span><strong>${coins(q.adventurerContribution)}</strong></div></div>
      <h3>Member elections</h3>
      ${q.memberLines.map(m=>`<div class="election-row"><strong>${escapeHtml(m.name)}</strong><span>${m.eligibilityName}</span><span class="status ${m.election!=='ENROLL'?'dim':''}">${m.election}</span></div>`).join('')}
      <button id="enrollBtn" class="primary">Confirm Enrollment</button><div id="enrollStatus"></div>
    </div>`;
  $('enrollBtn').onclick=enrollQuote;
}

async function enrollQuote() {
  const q=state.latestQuote; if(!q)return; $('enrollBtn').disabled=true;
  try {
    let payload, consumer;
    if(state.mode==='bff'){
      consumer=`POST /api/troll/bff/enroll\n\n${JSON.stringify({quoteId:q.id},null,2)}`;
      payload=await fetchJson('/api/troll/bff/enroll',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({quoteId:q.id})});
    }else{
      const query=`mutation Enroll($quoteId: ID!) { enrollTrollQuote(quoteId: $quoteId) { enrollment { id quoteId groupId status effectiveDate grossPremium guildContribution adventurerContribution plan { code name deductible battleCostSharePct maxQuestBurden } products { code name kind deductible } memberLines { memberId name eligibilityName election coverage { code name deductible baseRate adjustedRate } grossPremium } } group { id name location status agentId } trace backendCallCount } }`;
      consumer=`${query}\n\nvariables:\n${JSON.stringify({quoteId:q.id},null,2)}`;
      const result=await fetchJson('/troll-graphql',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query,variables:{quoteId:q.id}})}); if(result.errors)throw new Error(result.errors[0].message); payload=result.data.enrollTrollQuote;
    }
    if(payload.enrollment?.memberLines) payload.enrollment.memberLines=payload.enrollment.memberLines.map(m=>({...m,enrollmentStatus:m.enrollmentStatus||(m.election==='ENROLL'?'ACTIVE':m.election)}));
    state.latestEnrollment=payload.enrollment; state.claimEnrollment=payload.enrollment; state.latestGroupId=payload.group.id;
    $('enrollStatus').innerHTML=`<div class="success"><strong>Enrolled.</strong><br>${payload.enrollment.id} · Effective ${payload.enrollment.effectiveDate} · ${coins(payload.enrollment.grossPremium)}/mo<div class="action-row"><a class="doc-link" target="_blank" href="/api/troll/documents/enrollment/${payload.enrollment.id}">Open Guild Coverage Scroll</a><button class="ghost" id="claimFromEnroll">File a Claim</button></div><h3>Adventurer ID Cards</h3><div class="action-row">${payload.enrollment.memberLines.filter(m=>m.enrollmentStatus==='ACTIVE').map(m=>`<a class="mini-link" target="_blank" href="/api/troll/documents/member-card/${payload.enrollment.id}/${m.memberId}">${escapeHtml(m.name)} · ID Card</a>`).join('')}</div></div>`;
    $('claimFromEnroll').onclick=()=>{ state.claimEnrollment=payload.enrollment; renderClaimForm(); showView('claims'); };
    renderTrace(consumer,payload.trace,payload.backendCallCount); loadGroups();
  }catch(e){$('enrollStatus').innerHTML=`<div class="error">${escapeHtml(e.message)}</div>`;} finally{$('enrollBtn').disabled=false;}
}

async function loadGroups(){
  try{const groups=await fetchJson('/api/troll/groups'); if(!groups.length){$('groupList').innerHTML='No parties yet.';return;} $('groupList').className=''; $('groupList').innerHTML=groups.map(g=>`<div class="group-row" data-id="${g.id}"><div><strong>${escapeHtml(g.name)}</strong><div class="muted">${g.id} · ${pretty(g.location)}</div></div><span class="status">${g.status}</span></div>`).join(''); document.querySelectorAll('.group-row').forEach(row=>row.onclick=()=>loadGroupDetail(row.dataset.id));}catch(e){$('groupList').textContent=e.message;}
}
async function loadGroupDetail(id){
  try{
    let payload,consumer;
    if(state.mode==='bff'){consumer=`GET /api/troll/bff/groups/${id}`;payload=await fetchJson(`/api/troll/bff/groups/${id}`);}
    else{const query=`query Group($id: ID!) { trollGroup(id: $id) { group { id name location status agentId } quote { id status grossPremium guildContribution adventurerContribution groupClass memberCount eligibleMemberCount dependentCount effectiveDate plan { name } products { name code kind deductible } memberLines { memberId name eligibilityName election grossPremium } } enrollment { id quoteId groupId status effectiveDate grossPremium guildContribution adventurerContribution plan { code name deductible battleCostSharePct maxQuestBurden } products { code name kind deductible } memberLines { memberId name eligibilityName election coverage { code name deductible baseRate adjustedRate } grossPremium } } trace backendCallCount } }`; consumer=`${query}\n\nvariables:\n${JSON.stringify({id},null,2)}`; const result=await fetchJson('/troll-graphql',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query,variables:{id}})}); if(result.errors)throw new Error(result.errors[0].message); payload=result.data.trollGroup;}
    const {group,quote,enrollment}=payload;
    if (enrollment && enrollment.memberLines) enrollment.memberLines = enrollment.memberLines.map(m => ({...m, enrollmentStatus: m.enrollmentStatus || (m.election === 'ENROLL' ? 'ACTIVE' : m.election)}));
    if (enrollment) state.claimEnrollment=enrollment;
    $('groupDetail').innerHTML=`<div class="panel account-card"><div class="panel-heading"><div><span class="step">${group.id}</span><h2>${escapeHtml(group.name)}</h2></div><span class="status">${group.status}</span></div>${quote?`<div class="metric-grid"><div class="metric"><span>Plan</span><strong>${quote.plan.name}</strong></div><div class="metric"><span>Latest quote</span><strong>${quote.id} · ${quote.status}</strong></div><div class="metric"><span>Gross premium</span><strong>${coins(quote.grossPremium)}/mo</strong></div><div class="metric"><span>Effective</span><strong>${quote.effectiveDate}</strong></div><div class="metric"><span>Agent</span><strong>${group.agentId || 'A-101'}</strong></div></div><h3>Adventurers</h3>${quote.memberLines.map(m=>`<div class="election-row"><strong>${escapeHtml(m.name)}</strong><span>${m.eligibilityName}</span><span>${m.election}</span><span>${coins(m.grossPremium)}</span>${enrollment && (m.election==='ENROLL')?`<a class="mini-link" target="_blank" href="/api/troll/documents/member-card/${enrollment.id}/${m.memberId}">ID Card</a>`:''}</div>`).join('')}`:'<p class="muted">No quote yet.</p>'}${enrollment?`<div class="success"><strong>${enrollment.id} · ${enrollment.status}</strong><br>Coverage effective ${enrollment.effectiveDate}<div class="action-row"><a class="doc-link" target="_blank" href="/api/troll/documents/enrollment/${enrollment.id}">Open Guild Coverage Scroll</a><button class="ghost" id="fileGroupClaim">File a Claim</button></div></div>`:''}</div>`;
    if(enrollment) $('fileGroupClaim').onclick=()=>{ state.claimEnrollment=enrollment; renderClaimForm(); showView('claims'); };
    renderTrace(consumer,payload.trace,payload.backendCallCount);
  }catch(e){$('groupDetail').innerHTML=`<p class="error">${escapeHtml(e.message)}</p>`;}
}

function renderClaimForm(){
  const enrollment=state.claimEnrollment || state.latestEnrollment;
  if(!enrollment){ $('claimEmpty').classList.remove('hidden'); $('claimForm').classList.add('hidden'); return; }
  $('claimEmpty').classList.add('hidden'); $('claimForm').classList.remove('hidden');
  $('claimContext').innerHTML=`<div class="metric-grid"><div class="metric"><span>Enrollment</span><strong>${enrollment.id}</strong></div><div class="metric"><span>Effective</span><strong>${enrollment.effectiveDate}</strong></div></div>`;
  const active=(enrollment.memberLines||[]).filter(m=>(m.enrollmentStatus || (m.election==='ENROLL'?'ACTIVE':m.election))==='ACTIVE');
  $('claimMember').innerHTML=active.map(m=>`<option value="${m.memberId}">${escapeHtml(m.name)}</option>`).join('');
  $('claimDate').value=new Date().toISOString().slice(0,10);
  syncClaimProducts();
}
function syncClaimProducts(){
  const enrollment=state.claimEnrollment || state.latestEnrollment; if(!enrollment)return;
  const member=(enrollment.memberLines||[]).find(m=>m.memberId===$('claimMember').value) || enrollment.memberLines?.[0];
  $('claimProduct').innerHTML=(member?.coverage||[]).map(c=>`<option value="${c.code}">${escapeHtml(c.name)}</option>`).join('');
}
async function submitClaim(){
  const enrollment=state.claimEnrollment || state.latestEnrollment; if(!enrollment)return;
  const input={enrollmentId:enrollment.id,memberId:$('claimMember').value,productCode:$('claimProduct').value,incidentType:$('claimIncident').value,healerName:$('claimHealer').value.trim()||'Moonwell Healing Hall',incidentDate:$('claimDate').value,submittedCharge:Number($('claimCharge').value||0)};
  $('claimBtn').disabled=true; $('claimBtn').textContent='Adjudicating…';
  try{
    let payload,consumer;
    if(state.mode==='bff'){
      consumer=`POST /api/troll/bff/claims\n\n${JSON.stringify(input,null,2)}`;
      payload=await fetchJson('/api/troll/bff/claims',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});
    }else{
      const query=`mutation Claim($input: ClaimInput!) { submitTrollClaim(input: $input) { claim { id enrollmentId groupId memberId memberName productCode productName incidentType healerName incidentDate status submittedCharge allowedCharge deductibleApplied battleCostSharePct battleCostShare trollSurePays adventurerOwes } trace backendCallCount } }`;
      consumer=`${query}\n\nvariables:\n${JSON.stringify({input},null,2)}`;
      const result=await fetchJson('/troll-graphql',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query,variables:{input}})}); if(result.errors)throw new Error(result.errors[0].message); payload=result.data.submitTrollClaim;
    }
    state.latestClaim=payload.claim; renderClaimResult(payload.claim); renderTrace(consumer,payload.trace,payload.backendCallCount);
  }catch(e){$('claimResultEmpty').classList.add('hidden');$('claimResult').classList.remove('hidden');$('claimResult').innerHTML=`<div class="error">${escapeHtml(e.message)}</div>`;}
  finally{$('claimBtn').disabled=false;$('claimBtn').textContent='Submit Claim';}
}
function renderClaimResult(c){
  $('claimResultEmpty').classList.add('hidden'); $('claimResult').classList.remove('hidden');
  $('claimResult').innerHTML=`<div class="quote-hero"><div><div class="status">${c.id} · ${c.status}</div><strong>${escapeHtml(c.memberName)}</strong><div class="muted">${escapeHtml(c.productName)} · ${escapeHtml(c.incidentType)}</div></div><div class="price">${coins(c.trollSurePays)} <small>paid</small></div></div>
  <div class="claim-ledger"><div><span>Submitted charge</span><strong>${coins(c.submittedCharge)}</strong></div><div><span>Guild-allowed charge</span><strong>${coins(c.allowedCharge)}</strong></div><div><span>Deductible applied</span><strong>${coins(c.deductibleApplied)}</strong></div><div><span>Battle Cost Share</span><strong>${c.battleCostSharePct}% · ${coins(c.battleCostShare)}</strong></div><div class="pay"><span>TrollSure pays</span><strong>${coins(c.trollSurePays)}</strong></div><div class="owe"><span>Adventurer owes</span><strong>${coins(c.adventurerOwes)}</strong></div></div>
  <div class="action-row"><a class="doc-link" target="_blank" href="/api/troll/documents/claim/${c.id}">Claim Determination Scroll</a><a class="doc-link" target="_blank" href="/api/troll/documents/eob/${c.id}">Explanation of Battle Benefits</a></div>`;
}

async function loadAgentPortal() {
  try {
    const id=state.activeAgentId || $('agentSelect').value || 'A-101';
    $('agentSelect').value=id;
    let payload, consumer;
    if(state.mode==='bff') {
      consumer=`GET /api/troll/bff/agents/${id}`;
      payload=await fetchJson(`/api/troll/bff/agents/${id}`);
    } else {
      const query=`query Agent($id: ID!) { trollAgent(id: $id) { agent { id name title region commissionPct } metrics { groups activeEnrollments activeMembers monthlyPremium estimatedCommission } groups { id name location status agentId } enrollments { id groupId status grossPremium effectiveDate } trace backendCallCount } }`;
      consumer=`${query}\n\nvariables:\n${JSON.stringify({id},null,2)}`;
      const result=await fetchJson('/troll-graphql',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query,variables:{id}})});
      if(result.errors)throw new Error(result.errors[0].message);
      payload=result.data.trollAgent;
    }
    const a=payload.agent,m=payload.metrics;
    $('agentPortal').className='';
    $('agentPortal').innerHTML=`<div class="agent-hero"><div><span class="step">${a.id}</span><h2>${escapeHtml(a.name)}</h2><p class="muted">${escapeHtml(a.title)} · ${escapeHtml(a.region)}</p></div><div class="commission-seal">${a.commissionPct}%<small>commission</small></div></div>
      <div class="metric-grid agent-metrics"><div class="metric"><span>Groups</span><strong>${m.groups}</strong></div><div class="metric"><span>Active enrollments</span><strong>${m.activeEnrollments}</strong></div><div class="metric"><span>Covered adventurers</span><strong>${m.activeMembers}</strong></div><div class="metric"><span>Monthly premium</span><strong>${coins(m.monthlyPremium)}</strong></div><div class="metric"><span>Estimated monthly commission</span><strong>${coins(m.estimatedCommission)}</strong></div></div>
      <h3>Book of Business</h3>${payload.groups.length?payload.groups.map(g=>`<div class="group-row agent-group" data-id="${g.id}"><div><strong>${escapeHtml(g.name)}</strong><div class="muted">${g.id} · ${pretty(g.location)}</div></div><span class="status">${g.status}</span></div>`).join(''):'<div class="empty-state">No guilds assigned yet. Sell harder, risk scribe.</div>'}`;
    document.querySelectorAll('.agent-group').forEach(row=>row.onclick=()=>{ showView('groups'); loadGroupDetail(row.dataset.id); });
    renderTrace(consumer,payload.trace,payload.backendCallCount);
  } catch(e) {
    $('agentPortal').className='error'; $('agentPortal').textContent=e.message;
  }
}

async function loadRates(){
  try{
    const data=await fetchJson('/api/troll/rates');
    $('rateTable').innerHTML=`
      <h3>Core Troll plan comparison</h3>
      <div class="plan-table-wrap"><table><thead><tr><th>Plan</th><th>Rate factor</th><th>Deductible</th><th>Battle cost share</th><th>Max Quest Burden</th></tr></thead><tbody>${data.plans.map(p=>`<tr><td><strong>${p.name}</strong></td><td>${Math.round(p.rateMultiplier*100)}%</td><td>${coins(p.deductible)}</td><td>${p.battleCostSharePct}%</td><td>${coins(p.maxQuestBurden)}</td></tr>`).join('')}</tbody></table></div>
      <h3>Base monthly product rates</h3>
      <div class="plan-table-wrap"><table><thead><tr><th>Product</th><th>Individual</th><th>Member + 1</th><th>Family</th></tr></thead><tbody>${data.products.map(p=>`<tr><td>${p.name}</td>${['individual','plusOne','family'].map(t=>`<td>${coins(p.rates[t])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <h3>Eligibility classes</h3>
      <div class="eligibility-cards">${data.eligibilityClasses.map(c=>`<div class="metric"><span>${c.eligible?'ELIGIBLE':'INELIGIBLE'}</span><strong>${c.name}</strong><small>${c.note}</small></div>`).join('')}</div>
      <p class="muted">Upper Lands: base · Lower Lands: +${data.rules.locations.LOWER_LANDS}% · Large group 11+: −${data.rules.groupSize.largeDiscountPct}% · Orc Liver Use: +${data.rules.underwriting.orcLiverUsePct}% on Troll Insurance only · Quotes expire after ${data.rules.quoteExpirationDays} days.</p>`;
  }catch(e){$('rateTable').textContent=e.message;}
}

function renderTrace(consumer,trace,count){$('consumerRequest').textContent=consumer;$('traceList').innerHTML=(trace||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');$('callCount').textContent=`${count||0} backend calls`;}
async function fetchJson(url,options){const r=await fetch(url,options);const data=await r.json();if(!r.ok)throw new Error(data.error||`Request failed: ${r.status}`);return data;}
function coins(value){const tenths=Math.round(Number(value||0)*10);const gp=Math.floor(tenths/10);const sp=tenths%10;return sp?`${gp} gp ${sp} sp`:`${gp} gp`;}
function pretty(s){return String(s||'').toLowerCase().split('_').map(x=>x[0]?.toUpperCase()+x.slice(1)).join(' ')}
function prettyTier(t){return t==='plusOne'?'Member + 1':t==='family'?'Family':'Individual'}
function escapeHtml(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
renderMembers(); loadRates();
