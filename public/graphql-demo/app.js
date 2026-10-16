let mode = 'GRAPHQL';
let view = 'MANAGEMENT';
let kind = 'ADVENTURER';
let stage = 1;

const $ = id => document.getElementById(id);
const pretty = value => JSON.stringify(value, null, 2);
const stageInfo = [
  { title: 'Simple product', short: 'Core', copy: 'One shared creature shape and battle stats. Everything still feels easy.', next: 'Next: richer creature details.' },
  { title: 'Richer details', short: 'Details', copy: 'Product now wants abilities and equipment on the same screen.', next: 'Next: add a specialized monster segment.' },
  { title: 'Monster segment', short: 'Segment', copy: 'Monsters add specialized behavior such as legendary actions.', next: 'Next: introduce a boss segment.' },
  { title: 'Boss segment + loot', short: 'Boss', copy: 'Boss monsters reuse the same core data but also require a loot table.', next: 'Next: bosses get multi-phase encounters.' },
  { title: 'Multi-phase bosses', short: 'Phases', copy: 'Boss encounters now need phase data in addition to everything already required.', next: 'Next: one more perfectly reasonable requirement.' },
  { title: 'Lair actions', short: 'Lair', copy: 'Bosses now need lair actions too. Nothing individually crazy — but the integrations keep accumulating.', next: 'You have reached the full demo.' }
];

const servicesByStage = [
  ['Type API','Battle Stats'],
  ['Type API','Battle Stats','Abilities','Equipment'],
  ['Type API','Battle Stats','Abilities','Equipment','Legendary Actions'],
  ['Type API','Battle Stats','Abilities','Equipment','Legendary Actions','Loot'],
  ['Type API','Battle Stats','Abilities','Equipment','Legendary Actions','Loot','Phases'],
  ['Type API','Battle Stats','Abilities','Equipment','Legendary Actions','Loot','Phases','Lair Actions']
];

const creatureFields = `
      id
      kind
      name
      level
      hitPoints
      armorClass
      initiative
      speed
      abilities
      equipment
      ... on Adventurer { className ancestry experience }
      ... on Monster { challengeRating monsterType legendary legendaryActions }
      ... on BossMonster { challengeRating monsterType legendary legendaryActions loot phases lairActions }`;

function escapeHtml(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function activeServices(){ return servicesByStage[stage-1]; }
function relevantServices(){
  const all = ['Type API','Battle Stats'];
  if(stage>=2) all.push('Abilities','Equipment');
  if(stage>=3 && kind!=='ADVENTURER') all.push('Legendary Actions');
  if(kind==='BOSS' && stage>=4) all.push('Loot');
  if(kind==='BOSS' && stage>=5) all.push('Phases');
  if(kind==='BOSS' && stage>=6) all.push('Lair Actions');
  return all;
}
function modeName(){ return mode==='REST' ? 'Direct REST' : mode==='BFF' ? 'REST BFF' : 'GraphQL'; }

function updateStage(){
  $('stage-number').textContent = stage;
  const info = stageInfo[stage-1];
  $('requirement-title').textContent = info.title;
  $('requirement-copy').textContent = info.copy;
  $('next-requirement').textContent = info.next;
  $('add-requirement').disabled = stage===6;
  $('add-requirement').textContent = stage===6 ? '✓ Full growth scenario reached' : '📣 Product added another requirement';
  $('stage-track').innerHTML = stageInfo.map((s,i)=>`<div class="stage-dot ${i+1<stage?'done':''} ${i+1===stage?'current':''}"><strong>${i+1}. ${s.short}</strong>${s.title}</div>`).join('');
  updateArchitecture();
  clearResults();
}

function updateArchitecture(){
  const services = activeServices();
  const graph = mode==='GRAPHQL';
  const bff = mode==='BFF';
  if (graph) {
    $('mode-summary').textContent = 'The UI knows one domain contract and asks for the fields it needs. GraphQL owns service selection and response composition.';
    $('layman-text').textContent = 'Customers use one service desk and can ask for exactly the pieces they need. The desk knows the warehouse layout.';
    $('request-caption').textContent = 'The consumer describes the creature-shaped fields it wants. Backend topology stays behind the GraphQL contract.';
    $('trace-explanation').textContent = 'GraphQL resolvers absorb backend knowledge and compose existing REST services.';
  } else if (bff) {
    $('mode-summary').textContent = 'The UI calls one purpose-built REST endpoint. The BFF owns service selection and returns a fixed screen-shaped response.';
    $('layman-text').textContent = 'Customers use one staffed pickup counter. The counter has a fixed menu and gathers everything behind the scenes.';
    $('request-caption').textContent = 'The consumer calls one REST aggregation endpoint designed for this workflow. The response shape is decided by the server.';
    $('trace-explanation').textContent = 'The BFF endpoint absorbs backend knowledge and composes existing REST services.';
  } else {
    $('mode-summary').textContent = 'The UI knows the service topology, segment rules, endpoint paths, and how to merge each response.';
    $('layman-text').textContent = 'Every customer gets a warehouse map and must visit each shelf themselves. Add a shelf, update every map.';
    $('request-caption').textContent = 'The consumer contains orchestration logic: segment checks, endpoint selection, sequencing, and merging.';
    $('trace-explanation').textContent = 'The browser owns the backend knowledge and performs the composition itself.';
  }

  const middle = graph
    ? '<div class="map-node router">GraphQL facade<small>flexible domain query</small></div>'
    : bff
      ? '<div class="map-node router">REST BFF<small>fixed aggregation endpoint</small></div>'
      : '<div class="map-node warning">UI orchestration<small>routing + merging rules</small></div>';
  $('dependency-map').innerHTML = `<div class="map"><div class="map-node">UI<small>Creature screen</small></div><div class="map-arrow">→</div>${middle}<div class="map-arrow">→</div><div class="service-stack">${services.map(s=>`<div class="service ${mode==='REST'?'consumer-known':''}">REST: ${s}</div>`).join('')}</div></div>`;

  const uiEndpoints = mode==='REST' ? services.length + (stage>=3 ? 2 : 0) : 1;
  const uiBranches = mode==='REST' ? Math.max(1, stage) + (stage>=3 ? 2 : 0) : 0;
  const changeSurfaces = mode==='REST' ? Math.min(8, stage + 1) : 1;
  const complexity = mode==='REST' ? Math.min(100, 12 + stage*14) : bff ? Math.min(38, 14 + stage*4) : Math.min(28, 10 + stage*3);
  $('ui-endpoints').textContent = uiEndpoints;
  $('ui-branches').textContent = uiBranches;
  $('backend-services').textContent = services.length;
  $('change-surfaces').textContent = changeSurfaces;
  $('complexity-fill').style.width = `${complexity}%`;
  $('complexity-word').textContent = mode==='REST' ? (stage<3?'LOW':'HIGH') : bff ? 'CONTROLLED' : (stage<5?'LOW':'CONTROLLED');
  $('complexity-summary').textContent = mode==='REST'
    ? `The UI now carries knowledge of ${uiEndpoints} endpoints and ${uiBranches} routing rules.`
    : bff
      ? `The UI still knows one REST endpoint. The BFF hides ${services.length} backend services, but its response shape is purpose-built.`
      : `Backend reuse grows to ${services.length} REST services without exposing that topology to the UI.`;

  $('rest-takeaway').textContent = `At stage ${stage}, each consumer must understand more service locations and segment-specific rules. Change spreads outward.`;
  $('bff-takeaway').textContent = `At stage ${stage}, the UI still calls one REST endpoint. Composition is centralized, but the endpoint is designed around a particular screen/workflow.`;
  $('graphql-takeaway').textContent = `At stage ${stage}, consumers still use one contract and can request different field combinations without creating a new endpoint for every shape.`;

  if(view==='DEVELOPER'){
    $('layman-text').textContent = graph
      ? 'Resolvers hide service topology, normalize response shapes, and let clients select fields through a typed schema.'
      : bff
        ? 'A purpose-built REST controller owns orchestration and returns a fixed DTO tailored to the consumer workflow.'
        : 'Client code owns endpoint selection, branching, partial-failure handling, and object composition.';
  }
}

function clearResults(){
  $('request-view').textContent='Run a request to see the difference.';
  $('response-view').textContent='No creature yet.';
  $('trace').className='trace empty'; $('trace').textContent='Run an action and the request path will appear here.';
  ['browser-calls','routing-decisions','backend-calls','failure-points'].forEach(id=>$(id).textContent='—');
  $('browser-calls-help').textContent='Run an action.'; $('routing-help').textContent='Run an action.'; $('failure-help').textContent='Places a consumer must know can change/fail.';
}

function setMode(next){ mode=next; document.querySelectorAll('.mode-button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode)); updateArchitecture(); clearResults(); }
function setView(next){ view=next; document.querySelectorAll('.view-button').forEach(b=>b.classList.toggle('active',b.dataset.view===view)); updateArchitecture(); }
function setKind(next){ kind=next; document.querySelectorAll('.kind').forEach(b=>b.classList.toggle('active',b.dataset.kind===kind)); $('adventurer-fields').classList.toggle('hidden',kind!=='ADVENTURER'); $('monster-fields').classList.toggle('hidden',kind==='ADVENTURER'); if(kind==='BOSS'){$('legendary').checked=true;$('legendary').disabled=true;$('name').value='Vharos the Budget Destroyer';$('level').value=20;$('hitPoints').value=480;$('armorClass').value=23;} else {$('legendary').disabled=false;} updateArchitecture(); clearResults(); }

document.querySelectorAll('.mode-button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
document.querySelectorAll('.view-button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelectorAll('.kind').forEach(b=>b.addEventListener('click',()=>setKind(b.dataset.kind)));
$('add-requirement').addEventListener('click',()=>{if(stage<6){stage++; if(stage===4)setKind('BOSS'); updateStage();}});
$('reset-growth').addEventListener('click',()=>{stage=1; setKind('ADVENTURER'); updateStage();});

async function graphql(query,variables={}){const r=await fetch('/graphql',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query,variables})});return r.json()}
async function rest(path,options={}){const r=await fetch(path,options);const body=await r.json();if(!r.ok)throw new Error(body.error||`REST call failed: ${path}`);return body}
function readForm(){const common={name:$('name').value,level:Number($('level').value),hitPoints:Number($('hitPoints').value),armorClass:Number($('armorClass').value)};if(kind==='ADVENTURER')return{...common,className:$('className').value,ancestry:$('ancestry').value,experience:Number($('experience').value)};return{...common,challengeRating:Number($('challengeRating').value),monsterType:$('monsterType').value,legendary:kind==='BOSS'?true:$('legendary').checked}}
function renderTrace(lines){$('trace').className='trace';$('trace').innerHTML='';lines.forEach((line,i)=>{const el=document.createElement('div');el.className='trace-step';el.innerHTML=`<span class="step-number">${i+1}</span><span>${escapeHtml(line)}</span>`;$('trace').appendChild(el)})}
function metrics(backendCalls){const integrations=relevantServices().length;$('browser-calls').textContent=mode==='REST'?integrations:1;$('routing-decisions').textContent=mode==='REST'?Math.max(1,integrations-1):0;$('backend-calls').textContent=backendCalls;$('failure-points').textContent=mode==='REST'?integrations:1;$('browser-calls-help').textContent=mode==='REST'?'The UI makes each required REST request itself.':'One business request crosses the consumer boundary.';$('routing-help').textContent=mode==='REST'?'Segment and service decisions live in UI code.':`${modeName()} owns the backend routing.`;$('failure-help').textContent=mode==='REST'?'Each REST dependency is directly coupled to the consumer.':'The UI integrates with one contract.'}
function restPathsFor(idOrKind, isCreate=false){const k=isCreate?idOrKind:(idOrKind.startsWith('a')?'ADVENTURER':idOrKind.startsWith('m')?'MONSTER':'BOSS');const prefix=k==='ADVENTURER'?'adventurers':k==='MONSTER'?'monsters':'bosses';const id=isCreate?null:idOrKind;const paths=[`/api/${prefix}${id?`/${id}`:''}`];if(!isCreate)paths.push(`/api/battle-stats/${id}`);else paths.push('/api/battle-stats/{newId}');if(stage>=2){paths.push(`/api/abilities/${id||'{newId}'}`,`/api/equipment/${id||'{newId}'}`)}if(stage>=3&&k!=='ADVENTURER')paths.push(`/api/legendary-actions/${id||'{newId}'}`);if(k==='BOSS'&&stage>=4)paths.push(`/api/loot/${id||'{newId}'}`);if(k==='BOSS'&&stage>=5)paths.push(`/api/phases/${id||'{newId}'}`);if(k==='BOSS'&&stage>=6)paths.push(`/api/lair-actions/${id||'{newId}'}`);return paths}

async function createViaGraphQL(data){const q=`mutation CreateCreature($input: CreateCreatureInput!, $requirementLevel: Int!) {\n  createCreature(input: $input, requirementLevel: $requirementLevel) {\n    creature {${creatureFields}\n    }\n    routeTrace\n    backendCallCount\n  }\n}`;const input={kind,...data};$('request-view').textContent=`${q}\n\nvariables:\n${pretty({input,requirementLevel:stage})}`;const result=await graphql(q,{input,requirementLevel:stage});if(result.errors)throw new Error(result.errors[0].message);const p=result.data.createCreature;$('response-view').textContent=pretty(p.creature);renderTrace(p.routeTrace);metrics(p.backendCallCount)}
async function createViaBff(data){const input={kind,...data};const path=`/api/bff/creatures?requirementLevel=${stage}`;$('request-view').textContent=`POST ${path}\nContent-Type: application/json\n\n${pretty(input)}\n\n// Fixed REST aggregation contract for this workflow`;
  const p=await rest(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});$('response-view').textContent=pretty(p.creature);renderTrace(p.routeTrace);metrics(p.backendCallCount)}
async function createViaRest(data){const paths=restPathsFor(kind,true);$('request-view').textContent=`// UI orchestration grows with product requirements\nif (kind === '${kind}') {\n${paths.map((p,i)=>`  ${i===0?'POST':'GET '} ${p}`).join('\n')}\n  merge every response into one screen model\n}`;const basePath=paths[0];const created=await rest(basePath,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const actualPaths=restPathsFor(created.id,false).slice(1);const responses=await Promise.all(actualPaths.map(p=>rest(p)));const combined=Object.assign({},created,...responses);$('response-view').textContent=pretty(combined);renderTrace([`UI checked segment: ${kind}`,`UI → REST POST ${basePath}`,...actualPaths.map(p=>`UI → REST GET ${p}`),'UI merged every response itself']);metrics(1+actualPaths.length)}
async function loadViaGraphQL(id){const q=`query GetCreature($id: ID!, $requirementLevel: Int!) {\n  creature(id: $id, requirementLevel: $requirementLevel) {\n    creature {${creatureFields}\n    }\n    routeTrace\n    backendCallCount\n  }\n}`;$('request-view').textContent=`${q}\n\nvariables:\n${pretty({id,requirementLevel:stage})}`;const result=await graphql(q,{id,requirementLevel:stage});if(result.errors)throw new Error(result.errors[0].message);const p=result.data.creature;$('response-view').textContent=pretty(p.creature);renderTrace(p.routeTrace);metrics(p.backendCallCount)}
async function loadViaBff(id){const path=`/api/bff/creatures/${id}?requirementLevel=${stage}`;$('request-view').textContent=`GET ${path}\n\n// One fixed REST aggregation endpoint returns the screen-shaped object`;const p=await rest(path);$('response-view').textContent=pretty(p.creature);renderTrace(p.routeTrace);metrics(p.backendCallCount)}
async function loadViaRest(id){const paths=restPathsFor(id,false);$('request-view').textContent=`// UI infers the segment, then knows every service it needs\n${paths.map(p=>`GET ${p}`).join('\n')}\nmerge the responses`;const responses=await Promise.all(paths.map(p=>rest(p)));const combined=Object.assign({},...responses);$('response-view').textContent=pretty(combined);renderTrace([`UI inspected id "${id}" and selected a segment`,...paths.map(p=>`UI → REST GET ${p}`),'UI merged every response itself']);metrics(paths.length)}

$('forge-form').addEventListener('submit',async e=>{e.preventDefault();try{const data=readForm();if(mode==='GRAPHQL')await createViaGraphQL(data);else if(mode==='BFF')await createViaBff(data);else await createViaRest(data)}catch(err){$('response-view').textContent=`Error: ${err.message}`;renderTrace(['The request failed before the demo could finish.'])}});
$('load-example').addEventListener('click',async()=>{setKind('BOSS');try{if(mode==='GRAPHQL')await loadViaGraphQL('b1');else if(mode==='BFF')await loadViaBff('b1');else await loadViaRest('b1')}catch(err){$('response-view').textContent=`Error: ${err.message}`}});

setMode('GRAPHQL');
updateStage();
