(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  const names = {
    Human: ['Mara Venn','Tomas Vale','Elian Rook','Nessa Thorn','Corin Hale','Sabine Mercer','Garrick Fen','Lysa Ward'],
    Dwarf: ['Brom Granite','Hilda Embervein','Dorrin Brasshand','Kelda Stonebraid','Orik Coalborn','Brynja Deepdelve'],
    Elf: ['Aelar Moonfall','Sylwen Lark','Theren Ashbough','Ilyra Vael','Caelis Dawnmere','Nyra Silversong'],
    Halfling: ['Pip Bramble','Merry Underhill','Tansy Quickstep','Odo Tealeaf','Nim Wicket','Bess Honeyfoot'],
    Orc: ['Graska Ironjaw','Murog Redtusk','Vesha Wolfscar','Korr Stonebreaker','Zura Ashhand','Drogan Thorn'],
    Goblin: ['Nib Wickwhistle','Skrik Copperpot','Moxie Ratchet','Grubbin Soot','Tikka Knifetooth','Boggle Wink'],
    Dragonborn: ['Rhogar Ashscale','Sava Embercrest','Korinn Brassclaw','Vezra Stormhide','Draxon Cinderborn','Nalaq Frostmark'],
    Tiefling: ['Vesper Ash','Morrow Vane','Nyx Ember','Caligo Reed','Riven Crow','Sable Marr']
  };

  const roles = {
    civilian: ['Innkeeper','Blacksmith','Herbalist','Caravan cook','Miller','Stablemaster','Map seller','Gravedigger','Tailor','Ferryman'],
    authority: ['Town watch captain','Magistrate','Tax collector','Temple warden','Guild inspector','Border officer','Court herald'],
    criminal: ['Fence','Smuggler','Burglar','Poison dealer','Bandit scout','Counterfeiter','Informant','Protection collector'],
    adventurer: ['Monster hunter','Relic seeker','Mercenary','Scout','Treasure diver','Retired delver','Bounty hunter'],
    mystic: ['Hedge mage','Dream reader','Rune keeper','Exorcist','Shrine keeper','Astrologer','Potion brewer']
  };

  const appearances = [
    'Always wears immaculate clothes that are one fashion decade out of date.',
    'Has a crooked nose, a warm smile, and hands covered in tiny scars.',
    'Keeps their hair brutally short and wears a coat with far too many pockets.',
    'Has one cloudy eye and a habit of staring a little too long before answering.',
    'Looks exhausted but somehow never stops moving.',
    'Wears a single expensive ring with no other jewelry.',
    'Is built like a doorframe and moves with surprising delicacy.',
    'Smells faintly of smoke, rain, and crushed mint.'
  ];

  const mannerisms = [
    'Counts quietly on their fingers while thinking.',
    'Answers questions with another question whenever possible.',
    'Laughs at the wrong moment, then immediately apologizes.',
    'Never sits with their back to a door.',
    'Uses everyone’s full name, even after being asked not to.',
    'Polishes whatever object is closest when nervous.',
    'Whispers the final three words of important sentences.',
    'Maintains intense eye contact while saying completely mundane things.'
  ];

  const wants = [
    'Enough money to disappear before the end of the week.',
    'Proof that someone powerful has been lying to the town.',
    'To protect a family member who absolutely does not deserve it.',
    'One final chance to recover a reputation they ruined themselves.',
    'A dangerous object removed from town without anyone asking questions.',
    'To be invited into a circle of people who currently ignore them.',
    'To settle a debt without the creditor learning where the money came from.',
    'To find the person who has been leaving messages outside their home.'
  ];

  const secrets = {
    grounded: ['They forged a signature that could ruin a respected local family.','They know exactly who committed a recent theft and accepted money to stay quiet.','Their respectable business is quietly insolvent.','They have been hiding a fugitive in a cellar for three nights.'],
    heroic: ['They once saved the town under another name and refuse to explain why they vanished.','They are protecting a relic that only responds to someone else.','They made a promise to an enemy that prevents them from acting openly.','They have been paying adventurers anonymously to solve a growing threat.'],
    grim: ['They helped cover up a death and now hear scratching beneath their floor every night.','Someone they buried recently has been seen walking outside town.','They owe a life-debt to a creature everyone believes is dead.','They are slowly becoming the thing they once hunted.'],
    weird: ['Their shadow occasionally points somewhere they are not looking.','Every mirror shows them wearing different clothes.','They receive letters from themselves dated six months in the future.','Small animals become unreasonably angry whenever they lie.']
  };

  const hooks = [
    'They mistake one of the party members for someone they have been waiting for.',
    'They offer good money for a job that sounds much too easy.',
    'They have an object the party needs, but refuse to sell it for coin.',
    'They are being followed and pretend not to notice.',
    'They recognize something the party is carrying and immediately become afraid.',
    'They ask for help, then deny ever speaking to the party five minutes later.',
    'A local villain is convinced this person matters far more than they seem to.'
  ];

  const tones = {
    grounded: { adjective: ['practical','guarded','patient','skeptical'], danger: 0 },
    heroic: { adjective: ['bold','earnest','restless','honorable'], danger: 1 },
    grim: { adjective: ['haunted','hard-eyed','bitter','fatalistic'], danger: 2 },
    weird: { adjective: ['eccentric','serene','unsettling','cheerfully ominous'], danger: 1 }
  };

  const archetypes = {
    guardian: { label:'Guardian', priority:['CON','STR','WIS'], hp:10, trait:'Stand Your Ground', blurb:'You solve problems by being the thing between danger and everyone else.' },
    scoundrel: { label:'Scoundrel', priority:['DEX','CHA','INT'], hp:8, trait:'Dirty Advantage', blurb:'Quick hands, quicker judgment, and a flexible relationship with permission.' },
    arcanist: { label:'Arcanist', priority:['INT','DEX','WIS'], hp:6, trait:'Arcane Insight', blurb:'You turn study, nerve, and dangerous curiosity into impossible solutions.' },
    warden: { label:'Warden', priority:['DEX','WIS','CON'], hp:8, trait:'Trailwise', blurb:'Part hunter, part guide, part person who notices the ambush first.' },
    devout: { label:'Devout', priority:['WIS','CON','CHA'], hp:8, trait:'Guiding Presence', blurb:'Faith, conviction, or sheer moral gravity lets you steady everyone around you.' },
    berserker: { label:'Berserker', priority:['STR','CON','DEX'], hp:12, trait:'Unrestrained Fury', blurb:'Subtlety is useful. So is hitting the problem until it stops being a problem.' },
    minstrel: { label:'Minstrel', priority:['CHA','DEX','WIS'], hp:8, trait:'Cutting Verse', blurb:'Stories, charm, nerve, and a suspicious talent for being exactly where events happen.' }
  };

  const backgroundHooks = {
    Soldier:'You still know the old signals, ranks, and shortcuts used by professional fighters.',
    Urchin:'You can read a street faster than most people can read a map.',
    Scholar:'You know where knowledge hides and how to recognize when a source is lying.',
    Outlander:'You are comfortable where roads stop being useful.',
    Merchant:'You understand value, leverage, and when someone is desperate to make a deal.',
    Artisan:'You can spot shoddy work, identify tools, and earn trust through competence.',
    Noble:'You understand status, etiquette, and exactly how much a title can get away with.',
    Criminal:'You know the signals, favors, and quiet economies respectable people pretend do not exist.',
    Sailor:'You can read weather, ropes, crews, and the mood of a dock before trouble starts.'
  };

  const statDefs = [
    ['STR','Strength'],['DEX','Dexterity'],['CON','Constitution'],['INT','Intelligence'],['WIS','Wisdom'],['CHA','Charisma']
  ];
  const POINT_POOL = 24;
  const MIN_STAT = 8;
  const MAX_STAT = 15;
  let stats = Object.fromEntries(statDefs.map(([abbr]) => [abbr, MIN_STAT]));
  let currentNpc = null;

  function randomAncestry(){ return pick(Object.keys(names)); }
  function randomName(ancestry){ return pick(names[ancestry] || names.Human); }
  function allRoles(){ return Object.values(roles).flat(); }
  function chosenRole(group){ return group === 'random' ? pick(allRoles()) : pick(roles[group]); }
  function mod(score){ return Math.floor((score - 10) / 2); }
  function modText(score){ const m = mod(score); return m >= 0 ? `+${m}` : `${m}`; }

  function generateNpc(){
    const tone = $('#npcTone').value;
    const ancestryChoice = $('#npcAncestry').value;
    const ancestry = ancestryChoice === 'random' ? randomAncestry() : ancestryChoice;
    const dangerous = $('#npcDangerous').checked;
    const role = chosenRole($('#npcRole').value);
    const threat = clamp(1 + tones[tone].danger + (dangerous ? 3 : 0) + Math.floor(Math.random()*3), 1, 8);
    const base = 8 + threat;
    const npcStats = {
      STR: clamp(base + Math.floor(Math.random()*5)-2, 6, 18),
      DEX: clamp(base + Math.floor(Math.random()*5)-2, 6, 18),
      CON: clamp(base + Math.floor(Math.random()*5)-2, 6, 18),
      INT: clamp(9 + Math.floor(Math.random()*7), 6, 18),
      WIS: clamp(9 + Math.floor(Math.random()*7), 6, 18),
      CHA: clamp(9 + Math.floor(Math.random()*7), 6, 18)
    };
    currentNpc = {
      name: randomName(ancestry), ancestry, role, tone, threat,
      descriptor: pick(tones[tone].adjective),
      appearance: pick(appearances), mannerism: pick(mannerisms), want: pick(wants),
      secret: pick(secrets[tone]), hook: pick(hooks), stats:npcStats,
      hp: 6 + threat * 5 + mod(npcStats.CON),
      defense: 10 + mod(npcStats.DEX) + Math.floor(threat/3)
    };
    renderNpc();
  }

  function renderNpc(){
    const n = currentNpc;
    if(!n) return;
    $('#npcResult').innerHTML = `
      <div class="character-name">
        <div><p class="eyebrow">GENERATED NPC</p><h2>${escapeHtml(n.name)}</h2><p>${escapeHtml(n.ancestry)} ${escapeHtml(n.role)} · ${escapeHtml(n.descriptor)}</p></div>
        <span class="badge">Threat ${n.threat}/8</span>
      </div>
      <div class="derived"><div><small>HP</small><strong>${n.hp}</strong></div><div><small>Defense</small><strong>${n.defense}</strong></div><div><small>Role</small><strong style="font-size:1rem">${escapeHtml(n.role)}</strong></div></div>
      <div class="quick-stats">${statDefs.map(([a])=>`<div class="quick-stat"><small>${a}</small><strong>${n.stats[a]}</strong></div>`).join('')}</div>
      <div class="detail-grid">
        <div class="detail"><span class="label">Appearance</span><p>${escapeHtml(n.appearance)}</p></div>
        <div class="detail"><span class="label">Mannerism</span><p>${escapeHtml(n.mannerism)}</p></div>
        <div class="detail"><span class="label">What they want</span><p>${escapeHtml(n.want)}</p></div>
        <div class="detail"><span class="label">Secret</span><p>${escapeHtml(n.secret)}</p></div>
        <div class="detail full"><span class="label">Drop them into the game</span><p>${escapeHtml(n.hook)}</p></div>
      </div>`;
  }

  function pointsSpent(){ return Object.values(stats).reduce((sum, s)=>sum + (s - MIN_STAT), 0); }
  function remaining(){ return POINT_POOL - pointsSpent(); }

  function renderStatEditor(){
    $('#pointsRemaining').textContent = remaining();
    $('#stats').innerHTML = statDefs.map(([abbr,name]) => `
      <div class="stat-row">
        <div><span class="stat-name">${name}</span><span class="stat-abbr">${abbr}</span></div>
        <button class="stat-btn" type="button" data-stat="${abbr}" data-delta="-1" ${stats[abbr] <= MIN_STAT ? 'disabled' : ''}>−</button>
        <div class="stat-score">${stats[abbr]}</div>
        <button class="stat-btn" type="button" data-stat="${abbr}" data-delta="1" ${stats[abbr] >= MAX_STAT || remaining() <= 0 ? 'disabled' : ''}>+</button>
      </div>`).join('');
  }

  function recommendedBuild(){
    stats = Object.fromEntries(statDefs.map(([a])=>[a,MIN_STAT]));
    const priority = archetypes[$('#pcArchetype').value].priority;
    const desired = [15,14,13];
    priority.forEach((stat,i)=> stats[stat]=desired[i]);
    let left = remaining();
    const others = statDefs.map(([a])=>a).filter(a=>!priority.includes(a));
    let i = 0;
    while(left>0){
      const key = others[i % others.length];
      if(stats[key] < 12){ stats[key]++; left--; }
      i++;
      if(i>100) break;
    }
    renderStatEditor();
  }

  function forgeCharacter(){
    const ancestry = $('#pcAncestry').value;
    const archetypeKey = $('#pcArchetype').value;
    const arch = archetypes[archetypeKey];
    const background = $('#pcBackground').value;
    const level = clamp(parseInt($('#pcLevel').value,10) || 1, 1, 20);
    $('#pcLevel').value = level;
    const enteredName = $('#pcName').value.trim();
    const name = enteredName || randomName(ancestry);
    if(!enteredName) $('#pcName').value = name;
    const hp = Math.max(1, arch.hp + mod(stats.CON) + (level-1) * Math.max(1, Math.floor(arch.hp/2) + mod(stats.CON)));
    const defense = 10 + mod(stats.DEX) + (archetypeKey === 'guardian' ? 2 : 0);
    const initiative = mod(stats.DEX);
    const bestStat = [...statDefs].sort((a,b)=>stats[b[0]]-stats[a[0]])[0][1];
    const complication = pick([
      'You owe a favor to someone you hoped never to see again.',
      'Someone important believes you are responsible for a failure that was not entirely yours.',
      'You possess a clue to a mystery you do not yet understand.',
      'You promised to return home after one last journey. This is now the third “last journey.”',
      'A rival keeps arriving one step ahead of you and you have no idea how.',
      'You are carrying something valuable that you cannot safely sell.'
    ]);
    const bond = pick([
      'You would cross a kingdom for the person who once gave you a second chance.',
      'Your old crew is scattered, but you still consider every one of them family.',
      'You are determined to prove that your mentor was right about you.',
      'A small community trusts you more than you think you deserve.',
      'You keep every promise made over a shared meal.'
    ]);

    $('#characterResult').innerHTML = `
      <div class="sheet-top">
        <div><p class="eyebrow">PLAYER CHARACTER</p><h2>${escapeHtml(name)}</h2><p>${escapeHtml(ancestry)} ${escapeHtml(arch.label)} · ${escapeHtml(background)} background</p></div>
        <div class="level-orb"><div><strong>${level}</strong><small>LEVEL</small></div></div>
      </div>
      <div class="derived"><div><small>Hit Points</small><strong>${hp}</strong></div><div><small>Defense</small><strong>${defense}</strong></div><div><small>Initiative</small><strong>${initiative>=0?'+':''}${initiative}</strong></div></div>
      <div class="stat-sheet">${statDefs.map(([abbr])=>`<div class="stat-box"><small>${abbr}</small><strong>${stats[abbr]}</strong><em>${modText(stats[abbr])}</em></div>`).join('')}</div>
      <div class="story">
        <div class="story-block"><strong>${escapeHtml(arch.trait)}</strong><p>${escapeHtml(arch.blurb)}</p></div>
        <div class="story-block"><strong>${escapeHtml(background)} experience</strong><p>${escapeHtml(backgroundHooks[background])}</p></div>
        <div class="story-block"><strong>Natural strength: ${escapeHtml(bestStat)}</strong><p>This is currently your strongest attribute. Your choices, not the generator, decided that.</p></div>
        <div class="story-block"><strong>Bond</strong><p>${escapeHtml(bond)}</p></div>
        <div class="story-block"><strong>Complication</strong><p>${escapeHtml(complication)}</p></div>
      </div>`;
  }

  $$('.mode-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.mode-btn').forEach(b=>b.classList.toggle('active', b===btn));
    const npc = btn.dataset.mode === 'npc';
    $('#npcMode').classList.toggle('hidden', !npc);
    $('#characterMode').classList.toggle('hidden', npc);
  }));

  $('#npcForm').addEventListener('submit', e => { e.preventDefault(); generateNpc(); });
  $('#rerollNpcName').addEventListener('click', () => { if(!currentNpc) generateNpc(); else { currentNpc.name = randomName(currentNpc.ancestry); renderNpc(); }});
  $('#characterForm').addEventListener('submit', e => { e.preventDefault(); forgeCharacter(); });
  $('#randomPcName').addEventListener('click', () => { $('#pcName').value = randomName($('#pcAncestry').value); });
  $('#resetStats').addEventListener('click', () => { stats = Object.fromEntries(statDefs.map(([a])=>[a,MIN_STAT])); renderStatEditor(); });
  $('#recommendedStats').addEventListener('click', recommendedBuild);
  $('#pcArchetype').addEventListener('change', () => {});
  $('#stats').addEventListener('click', e => {
    const btn = e.target.closest('.stat-btn');
    if(!btn) return;
    const stat = btn.dataset.stat;
    const delta = Number(btn.dataset.delta);
    if(delta > 0 && (remaining() <= 0 || stats[stat] >= MAX_STAT)) return;
    if(delta < 0 && stats[stat] <= MIN_STAT) return;
    stats[stat] += delta;
    renderStatEditor();
  });

  $('#npcResult').innerHTML = '<div class="result-empty"><div><span class="big">🎲</span><strong>No NPC yet.</strong><p>Choose a few constraints or embrace chaos, then generate one.</p></div></div>';
  $('#characterResult').innerHTML = '<div class="result-empty"><div><span class="big">🛡️</span><strong>Your character sheet will appear here.</strong><p>Pick a concept, spend your points, then forge the character.</p></div></div>';
  renderStatEditor();
})();
