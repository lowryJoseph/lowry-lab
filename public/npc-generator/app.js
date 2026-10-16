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
    guardian: { label:'Guardian', priority:['CON','STR','WIS'], hp:10, trait:'Stand Your Ground', blurb:'You solve problems by being the thing between danger and everyone else.', skills:['Athletics','Intimidation','Perception'], talents:['Shield Bash','Hold the Line','Battlefield Medic'] },
    scoundrel: { label:'Scoundrel', priority:['DEX','CHA','INT'], hp:8, trait:'Dirty Advantage', blurb:'Quick hands, quicker judgment, and a flexible relationship with permission.', skills:['Stealth','Sleight of Hand','Deception'], talents:['Cheap Shot','Ghost Step','Fast Talk'] },
    arcanist: { label:'Arcanist', priority:['INT','DEX','WIS'], hp:6, trait:'Arcane Insight', blurb:'You turn study, nerve, and dangerous curiosity into impossible solutions.', skills:['Arcana','Investigation','History'], talents:['Arcane Ward','Spell Echo','Forbidden Formula'] },
    warden: { label:'Warden', priority:['DEX','WIS','CON'], hp:8, trait:'Trailwise', blurb:'Part hunter, part guide, part person who notices the ambush first.', skills:['Survival','Perception','Nature'], talents:['Marked Quarry','Rapid Shot','Pathfinder'] },
    devout: { label:'Devout', priority:['WIS','CON','CHA'], hp:8, trait:'Guiding Presence', blurb:'Faith, conviction, or sheer moral gravity lets you steady everyone around you.', skills:['Medicine','Insight','Religion'], talents:['Healing Word','Turn the Wicked','Protective Blessing'] },
    berserker: { label:'Berserker', priority:['STR','CON','DEX'], hp:12, trait:'Unrestrained Fury', blurb:'Subtlety is useful. So is hitting the problem until it stops being a problem.', skills:['Athletics','Intimidation','Survival'], talents:['Reckless Swing','Blood Rush','Break Stuff'] },
    minstrel: { label:'Minstrel', priority:['CHA','DEX','WIS'], hp:8, trait:'Cutting Verse', blurb:'Stories, charm, nerve, and a suspicious talent for being exactly where events happen.', skills:['Performance','Persuasion','Insight'], talents:['Inspiring Chorus','Cutting Remark','Jack of All Trades'] }
  };

  const backgroundHooks = {
    Soldier:'You still know the old signals, ranks, and shortcuts used by professional fighters.',
    Urchin:'You can read a street faster than most people can read a map.', Scholar:'You know where knowledge hides and how to recognize when a source is lying.',
    Outlander:'You are comfortable where roads stop being useful.', Merchant:'You understand value, leverage, and when someone is desperate to make a deal.',
    Artisan:'You can spot shoddy work, identify tools, and earn trust through competence.', Noble:'You understand status, etiquette, and exactly how much a title can get away with.',
    Criminal:'You know the signals, favors, and quiet economies respectable people pretend do not exist.', Sailor:'You can read weather, ropes, crews, and the mood of a dock before trouble starts.'
  };

  const statDefs = [['STR','Strength'],['DEX','Dexterity'],['CON','Constitution'],['INT','Intelligence'],['WIS','Wisdom'],['CHA','Charisma']];
  const skillDefs = [
    ['Athletics','STR'],['Acrobatics','DEX'],['Stealth','DEX'],['Sleight of Hand','DEX'],
    ['Arcana','INT'],['History','INT'],['Investigation','INT'],['Nature','INT'],
    ['Insight','WIS'],['Medicine','WIS'],['Perception','WIS'],['Survival','WIS'],['Religion','WIS'],
    ['Deception','CHA'],['Intimidation','CHA'],['Performance','CHA'],['Persuasion','CHA']
  ];
  const weapons = [
    {name:'Longsword',damage:'1d8',stat:'STR',tags:'versatile'}, {name:'Battleaxe',damage:'1d8',stat:'STR',tags:'heavy edge'},
    {name:'Greatsword',damage:'2d6',stat:'STR',tags:'two-handed'}, {name:'Dagger',damage:'1d4',stat:'DEX',tags:'light, thrown'},
    {name:'Shortbow',damage:'1d6',stat:'DEX',tags:'ranged'}, {name:'Longbow',damage:'1d8',stat:'DEX',tags:'ranged, two-handed'},
    {name:'Quarterstaff',damage:'1d6',stat:'STR',tags:'simple'}, {name:'Arcane Focus',damage:'1d6',stat:'INT',tags:'spell focus'},
    {name:'Warhammer',damage:'1d8',stat:'STR',tags:'versatile'}
  ];
  const armors = [
    {name:'No Armor',base:10,dex:true,notes:'Full Dexterity'}, {name:'Leather Armor',base:11,dex:true,notes:'Light'},
    {name:'Studded Leather',base:12,dex:true,notes:'Light'}, {name:'Chain Shirt',base:13,dex:'cap2',notes:'Medium'},
    {name:'Scale Mail',base:14,dex:'cap2',notes:'Medium'}, {name:'Chain Mail',base:16,dex:false,notes:'Heavy'},
    {name:'Plate Armor',base:18,dex:false,notes:'Heavy'}
  ];
  const packs = {
    "Explorer's Pack": ['50 ft rope','Bedroll','Torch ×5','Rations ×5','Waterskin','Flint & steel'],
    "Delver's Pack": ['Crowbar','Chalk ×10','Lantern','Oil flask ×2','Rations ×3','50 ft rope'],
    "Scholar's Pack": ['Journal','Ink & quill','Reference tome','Sealing wax','Parchment ×10','Small knife'],
    "Burglar's Pack": ['Lockpicks','Dark cloak','Grappling hook','50 ft silk rope','Caltrops','Small mirror'],
    "Pilgrim's Pack": ['Bedroll','Holy token','Candles ×5','Rations ×5','Healer kit','Waterskin']
  };
  const lootTables = {
    Common:['Silvered compass','Smoke pellet ×2','Potion of mending','Lucky bone die','Ever-dry tinderbox'],
    Uncommon:['Whisperglass monocle','Boots of sure footing','Moon-thread cloak','Emberstone charm','Vial of ghost ink'],
    Rare:['Whispering Fang — +1 dagger; silent when drawn','Stormglass Bow — once per rest, arrow crackles with lightning','Lantern of Lost Roads — reveals hidden paths','Ironheart Buckler — once per rest, ignore one hit','Ring of Borrowed Luck — reroll one failed check per day'],
    Epic:['Crown of the Hollow King — command lesser undead briefly','Starfall Blade — +2 weapon; sheds starlight on command','Mantle of the Last Phoenix — survive one fatal blow, then crumbles','Gatekeeper Key — opens one magically sealed door per dawn'],
    Legendary:['Worldroot Seed — grows a temporary passage through stone','Blade of the First Oath — +3 weapon; strengthens sworn promises','Hourglass of the Seventh Bell — rewind one round once, ever','Crown of Storms — call a violent storm once per week']
  };

  const POINT_POOL = 27, MIN_STAT = 8, MAX_BASE_STAT = 15, MAX_FINAL_STAT = 20;
  const POINT_COST = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
  const ASI_LEVELS = [4,8,12,16,19];
  const BACKGROUND_ABILITIES = {
    Soldier:['STR','DEX','CON'], Urchin:['DEX','WIS','CHA'], Scholar:['INT','WIS','CHA'],
    Outlander:['STR','CON','WIS'], Merchant:['INT','WIS','CHA'], Artisan:['DEX','INT','WIS'],
    Noble:['INT','WIS','CHA'], Criminal:['DEX','INT','CHA'], Sailor:['STR','DEX','CON']
  };
  let stats = Object.fromEntries(statDefs.map(([abbr]) => [abbr, MIN_STAT]));
  let asiChoices = Object.fromEntries(ASI_LEVELS.map(level => [level, ['', '']]));
  let trainedSkills = new Set();
  let inventory = [];
  let currentNpc = null;
  let lastCharacter = null;

  function randomAncestry(){ return pick(Object.keys(names)); }
  function randomName(ancestry){ return pick(names[ancestry] || names.Human); }
  function allRoles(){ return Object.values(roles).flat(); }
  function chosenRole(group){ return group === 'random' ? pick(allRoles()) : pick(roles[group]); }
  function mod(score){ return Math.floor((score - 10) / 2); }
  function modText(score){ const m = mod(score); return m >= 0 ? `+${m}` : `${m}`; }
  function profBonus(level){ return 2 + Math.floor((level-1)/4); }

  function generateNpc(){
    const tone = $('#npcTone').value, ancestryChoice = $('#npcAncestry').value;
    const ancestry = ancestryChoice === 'random' ? randomAncestry() : ancestryChoice;
    const dangerous = $('#npcDangerous').checked, role = chosenRole($('#npcRole').value);
    const threat = clamp(1 + tones[tone].danger + (dangerous ? 3 : 0) + Math.floor(Math.random()*3), 1, 8), base = 8 + threat;
    const npcStats = {STR:clamp(base+Math.floor(Math.random()*5)-2,6,18),DEX:clamp(base+Math.floor(Math.random()*5)-2,6,18),CON:clamp(base+Math.floor(Math.random()*5)-2,6,18),INT:clamp(9+Math.floor(Math.random()*7),6,18),WIS:clamp(9+Math.floor(Math.random()*7),6,18),CHA:clamp(9+Math.floor(Math.random()*7),6,18)};
    currentNpc = {name:randomName(ancestry),ancestry,role,tone,threat,descriptor:pick(tones[tone].adjective),appearance:pick(appearances),mannerism:pick(mannerisms),want:pick(wants),secret:pick(secrets[tone]),hook:pick(hooks),stats:npcStats,hp:6+threat*5+mod(npcStats.CON),defense:10+mod(npcStats.DEX)+Math.floor(threat/3)};
    renderNpc();
  }
  function renderNpc(){ const n=currentNpc;if(!n)return;$('#npcResult').innerHTML=`<div class="character-name"><div><p class="eyebrow">GENERATED NPC</p><h2>${escapeHtml(n.name)}</h2><p>${escapeHtml(n.ancestry)} ${escapeHtml(n.role)} · ${escapeHtml(n.descriptor)}</p></div><span class="badge">Threat ${n.threat}/8</span></div><div class="derived"><div><small>HP</small><strong>${n.hp}</strong></div><div><small>Defense</small><strong>${n.defense}</strong></div><div><small>Role</small><strong style="font-size:1rem">${escapeHtml(n.role)}</strong></div></div><div class="quick-stats">${statDefs.map(([a])=>`<div class="quick-stat"><small>${a}</small><strong>${n.stats[a]}</strong></div>`).join('')}</div><div class="detail-grid"><div class="detail"><span class="label">Appearance</span><p>${escapeHtml(n.appearance)}</p></div><div class="detail"><span class="label">Mannerism</span><p>${escapeHtml(n.mannerism)}</p></div><div class="detail"><span class="label">What they want</span><p>${escapeHtml(n.want)}</p></div><div class="detail"><span class="label">Secret</span><p>${escapeHtml(n.secret)}</p></div><div class="detail full"><span class="label">Drop them into the game</span><p>${escapeHtml(n.hook)}</p></div></div>`; }

  function pointCost(score){ return POINT_COST[score] ?? 999; }
  function pointsSpent(){ return Object.values(stats).reduce((sum,s)=>sum+pointCost(s),0); }
  function remaining(){ return POINT_POOL-pointsSpent(); }
  function currentLevel(){ return clamp(parseInt($('#pcLevel').value,10)||1,1,20); }
  function unlockedAsiLevels(level=currentLevel()){ return ASI_LEVELS.filter(l=>level>=l); }
  function backgroundAbilityOptions(){ return BACKGROUND_ABILITIES[$('#pcBackground').value] || statDefs.map(([a])=>a); }
  function populateOriginBoosts(preferredPlus2, preferredPlus1){
    const allowed=backgroundAbilityOptions();
    const old2=preferredPlus2 || $('#originPlus2')?.value;
    const old1=preferredPlus1 || $('#originPlus1')?.value;
    const options=allowed.map(a=>`<option value="${a}">${a}</option>`).join('');
    $('#originPlus2').innerHTML=options; $('#originPlus1').innerHTML=options;
    const plus2=allowed.includes(old2)?old2:allowed[0];
    const plus1=allowed.includes(old1)&&old1!==plus2?old1:(allowed.find(a=>a!==plus2)||allowed[0]);
    $('#originPlus2').value=plus2; $('#originPlus1').value=plus1;
    $('#backgroundAbilityHint').textContent=`${$('#pcBackground').value} can boost ${allowed.join(', ')} in this lightweight ruleset.`;
  }
  function originBoosts(){
    const boosts=Object.fromEntries(statDefs.map(([a])=>[a,0]));
    const plus2=$('#originPlus2')?.value, plus1=$('#originPlus1')?.value;
    if(plus2) boosts[plus2]+=2;
    if(plus1 && plus1!==plus2) boosts[plus1]+=1;
    return boosts;
  }
  function levelBoosts(level=currentLevel()){
    const boosts=Object.fromEntries(statDefs.map(([a])=>[a,0]));
    for(const milestone of unlockedAsiLevels(level)){
      for(const ability of (asiChoices[milestone] || [])) if(ability) boosts[ability]+=1;
    }
    return boosts;
  }
  function finalStats(){
    const origin=originBoosts(), level=levelBoosts();
    return Object.fromEntries(statDefs.map(([a])=>[a,Math.min(MAX_FINAL_STAT,stats[a]+origin[a]+level[a])]));
  }
  function nextPointCost(stat){ if(stats[stat]>=MAX_BASE_STAT)return Infinity; return pointCost(stats[stat]+1)-pointCost(stats[stat]); }
  function renderFinalSummary(){
    const origin=originBoosts(), level=levelBoosts(), final=finalStats();
    $('#finalStatSummary').innerHTML=statDefs.map(([abbr,name])=>`<div class="final-stat-card"><div><strong>${abbr}</strong><small>${name}</small></div><div class="score-formula"><span>${stats[abbr]}</span><small>base</small></div><b>+</b><div class="score-formula"><span>${origin[abbr]}</span><small>background</small></div><b>+</b><div class="score-formula"><span>${level[abbr]}</span><small>level</small></div><b>=</b><div class="score-formula final"><span>${final[abbr]}</span><small>${modText(final[abbr])} mod</small></div></div>`).join('');
  }
  function renderStatEditor(){
    $('#pointsRemaining').textContent=remaining();
    $('#stats').innerHTML=statDefs.map(([abbr,name])=>`<div class="stat-row"><div class="stat-label"><span class="stat-name">${name}</span><span class="stat-abbr">${abbr}</span><small>cost ${pointCost(stats[abbr])} credits</small></div><button class="stat-btn" type="button" data-stat="${abbr}" data-delta="-1" ${stats[abbr]<=MIN_STAT?'disabled':''}>−</button><div class="stat-score">${stats[abbr]}</div><button class="stat-btn" type="button" data-stat="${abbr}" data-delta="1" ${stats[abbr]>=MAX_BASE_STAT||nextPointCost(abbr)>remaining()?'disabled':''}>+</button></div>`).join('');
    renderAdvancement(); renderFinalSummary();
  }
  function renderAdvancement(){
    const unlocked=unlockedAsiLevels();
    if(unlocked.length===0){
      $('#asiSummary').textContent='No Ability Score Improvement yet. The first opportunity is level 4.';
      $('#asiEditor').innerHTML='<div class="locked-asi">Level 1–3 characters do not receive extra ability points from leveling.</div>';
      return;
    }
    $('#asiSummary').textContent=`${unlocked.length} Ability Score Improvement ${unlocked.length===1?'choice':'choices'} unlocked at level ${currentLevel()}.`;
    const abilityOptions='<option value="">Choose ability</option>'+statDefs.map(([a,n])=>`<option value="${a}">${a} — ${n}</option>`).join('');
    $('#asiEditor').innerHTML=unlocked.map(level=>{
      const choices=asiChoices[level] || ['', ''];
      return `<div class="asi-milestone"><div><strong>Level ${level} ASI</strong><small>Same ability twice = +2. Two different abilities = +1 / +1.</small></div><div class="asi-choice-grid"><label>Point 1<select class="asi-choice" data-level="${level}" data-slot="0">${abilityOptions}</select></label><label>Point 2<select class="asi-choice" data-level="${level}" data-slot="1">${abilityOptions}</select></label></div></div>`;
    }).join('');
    $$('.asi-choice').forEach(select=>{ const choices=asiChoices[Number(select.dataset.level)] || ['', '']; select.value=choices[Number(select.dataset.slot)] || ''; });
  }
  function resetAbilityScores(){
    stats=Object.fromEntries(statDefs.map(([a])=>[a,MIN_STAT]));
    asiChoices=Object.fromEntries(ASI_LEVELS.map(level=>[level,['','']]));
    populateOriginBoosts(); renderStatEditor();
  }
  function recommendedBuild(){
    stats=Object.fromEntries(statDefs.map(([a])=>[a,MIN_STAT]));
    asiChoices=Object.fromEntries(ASI_LEVELS.map(level=>[level,['','']]));
    const priority=archetypes[$('#pcArchetype').value].priority;
    const exact27=[15,15,14,10,8,8];
    const ordered=[...priority, ...statDefs.map(([a])=>a).filter(a=>!priority.includes(a))];
    ordered.forEach((a,i)=>stats[a]=exact27[i]??8);
    populateOriginBoosts(priority[0], priority[1]);
    for(const milestone of unlockedAsiLevels()){
      const final=finalStats();
      const first=priority.find(a=>final[a]<MAX_FINAL_STAT) || priority[0];
      asiChoices[milestone][0]=first;
      const afterOne={...final,[first]:Math.min(MAX_FINAL_STAT,final[first]+1)};
      const second=priority.find(a=>afterOne[a]<MAX_FINAL_STAT) || first;
      asiChoices[milestone][1]=second;
    }
    renderStatEditor(); suggestSkills();
  }

  function renderSkills(){ const arch=archetypes[$('#pcArchetype').value];$('#skillsEditor').innerHTML=skillDefs.map(([name,stat])=>`<label class="skill-chip ${arch.skills.includes(name)?'recommended':''}"><input type="checkbox" data-skill="${name}" ${trainedSkills.has(name)?'checked':''}><span><strong>${name}</strong><small>${stat}${arch.skills.includes(name)?' · recommended':''}</small></span></label>`).join('');$('#skillsCount').textContent=trainedSkills.size; }
  function suggestSkills(){ trainedSkills=new Set(archetypes[$('#pcArchetype').value].skills.slice(0,3));const bg=$('#pcBackground').value;const bgMap={Soldier:'Athletics',Urchin:'Sleight of Hand',Scholar:'History',Outlander:'Survival',Merchant:'Persuasion',Artisan:'Investigation',Noble:'Insight',Criminal:'Stealth',Sailor:'Acrobatics'};if(bgMap[bg])trainedSkills.add(bgMap[bg]);renderSkills(); }

  function populateGear(){ $('#pcWeapon').innerHTML=weapons.map(w=>`<option>${w.name}</option>`).join('');$('#pcArmor').innerHTML=armors.map(a=>`<option>${a.name}</option>`).join('');$('#pcPack').innerHTML=Object.keys(packs).map(p=>`<option>${p}</option>`).join('');setRecommendedGear(); }
  function setRecommendedGear(){ const key=$('#pcArchetype').value;const map={guardian:['Longsword','Chain Mail',"Explorer's Pack"],scoundrel:['Dagger','Studded Leather',"Burglar's Pack"],arcanist:['Arcane Focus','No Armor',"Scholar's Pack"],warden:['Longbow','Leather Armor',"Explorer's Pack"],devout:['Warhammer','Chain Shirt',"Pilgrim's Pack"],berserker:['Greatsword','No Armor',"Explorer's Pack"],minstrel:['Dagger','Leather Armor',"Explorer's Pack"]};const [w,a,p]=map[key];$('#pcWeapon').value=w;$('#pcArmor').value=a;$('#pcPack').value=p; }
  function randomizeGear(){ $('#pcWeapon').value=pick(weapons).name;$('#pcArmor').value=pick(armors).name;$('#pcPack').value=pick(Object.keys(packs)); }

  function renderAbilities(){ const arch=archetypes[$('#pcArchetype').value];$('#abilityEditor').innerHTML=`<div class="signature"><span class="label">Signature feature</span><strong>${escapeHtml(arch.trait)}</strong><p>${escapeHtml(arch.blurb)}</p></div><div class="talent-list">${arch.talents.map((t,i)=>`<label class="talent"><input type="radio" name="pcTalent" value="${escapeHtml(t)}" ${i===0?'checked':''}><span>${escapeHtml(t)}</span></label>`).join('')}</div>`; }

  function renderInventory(){ $('#inventoryEditor').innerHTML=inventory.length?inventory.map((item,i)=>`<div class="inventory-row"><span>${escapeHtml(item)}</span><button type="button" class="remove-item" data-index="${i}" aria-label="Remove ${escapeHtml(item)}">×</button></div>`).join(''):'<p class="empty-inline">Nothing loose in the pack yet. Starting-pack items will be added when you forge the sheet.</p>'; }
  function addInventory(item){ const clean=String(item||'').trim();if(!clean)return;inventory.push(clean);renderInventory(); }
  function rollLoot(){ const rarity=$('#lootRarity').value;addInventory(`${rarity}: ${pick(lootTables[rarity])}`); }

  function armorDefense(armor, final=finalStats()){ const dex=mod(final.DEX);if(armor.dex===true)return armor.base+dex;if(armor.dex==='cap2')return armor.base+Math.min(2,dex);return armor.base; }
  function skillBonus(name,level, final=finalStats()){ const def=skillDefs.find(([n])=>n===name);const base=mod(final[def[1]]);return base+(trainedSkills.has(name)?profBonus(level):0); }

  function buildCharacter(){
    const ancestry=$('#pcAncestry').value,key=$('#pcArchetype').value,arch=archetypes[key],background=$('#pcBackground').value,outlook=$('#pcOutlook').value,level=clamp(parseInt($('#pcLevel').value,10)||1,1,20);$('#pcLevel').value=level;
    const entered=$('#pcName').value.trim(),name=entered||randomName(ancestry);if(!entered)$('#pcName').value=name;
    const weapon=weapons.find(w=>w.name===$('#pcWeapon').value)||weapons[0],armor=armors.find(a=>a.name===$('#pcArmor').value)||armors[0],packName=$('#pcPack').value;
    const final=finalStats();
    const talent=document.querySelector('input[name="pcTalent"]:checked')?.value||arch.talents[0],hp=Math.max(1,arch.hp+mod(final.CON)+(level-1)*Math.max(1,Math.floor(arch.hp/2)+mod(final.CON))),defense=armorDefense(armor,final),initiative=mod(final.DEX),speed=ancestry==='Dwarf'||ancestry==='Halfling'?25:30;
    const complication=pick(['You owe a favor to someone you hoped never to see again.','Someone important believes you are responsible for a failure that was not entirely yours.','You possess a clue to a mystery you do not yet understand.','You promised to return home after one last journey. This is now the third “last journey.”','A rival keeps arriving one step ahead of you and you have no idea how.','You are carrying something valuable that you cannot safely sell.']);
    const bond=pick(['You would cross a kingdom for the person who once gave you a second chance.','Your old crew is scattered, but you still consider every one of them family.','You are determined to prove that your mentor was right about you.','A small community trusts you more than you think you deserve.','You keep every promise made over a shared meal.']);
    const bestStat=[...statDefs].sort((a,b)=>final[b[0]]-final[a[0]])[0][1],attack=mod(final[weapon.stat])+profBonus(level),skillRows=skillDefs.map(([n,s])=>({name:n,stat:s,trained:trainedSkills.has(n),bonus:skillBonus(n,level,final)})).sort((a,b)=>(b.trained-a.trained)||b.bonus-a.bonus);
    const fullInventory=[...packs[packName],...inventory];
    return {name,ancestry,key,arch,background,outlook,level,weapon,armor,packName,talent,hp,defense,initiative,speed,attack,skillRows,fullInventory,bond,complication,bestStat,stats:{...final},baseStats:{...stats},originBoosts:originBoosts(),asiBoosts:levelBoosts(level),asiChoices:JSON.parse(JSON.stringify(asiChoices))};
  }

  function renderCharacter(c){
    const signed=n=>n>=0?`+${n}`:`${n}`;
    $('#characterResult').innerHTML=`
      <div class="sheet-top"><div><p class="eyebrow">PLAYER CHARACTER</p><h2>${escapeHtml(c.name)}</h2><p>${escapeHtml(c.ancestry)} ${escapeHtml(c.arch.label)} · ${escapeHtml(c.background)} · ${escapeHtml(c.outlook)}</p></div><div class="level-orb"><div><strong>${c.level}</strong><small>LEVEL</small></div></div></div>
      <div class="derived four"><div><small>Hit Points</small><strong>${c.hp}</strong></div><div><small>Defense</small><strong>${c.defense}</strong></div><div><small>Initiative</small><strong>${signed(c.initiative)}</strong></div><div><small>Speed</small><strong>${c.speed}</strong></div></div>
      <div class="stat-sheet">${statDefs.map(([a])=>`<div class="stat-box"><small>${a}</small><strong>${c.stats[a]}</strong><em>${modText(c.stats[a])}</em></div>`).join('')}</div>
      <div class="sheet-section"><h3>Combat & Gear</h3><div class="gear-sheet"><div><span class="label">Weapon</span><strong>${escapeHtml(c.weapon.name)}</strong><small>${escapeHtml(c.weapon.damage)} · ${escapeHtml(c.weapon.stat)} · attack ${signed(c.attack)}</small></div><div><span class="label">Armor</span><strong>${escapeHtml(c.armor.name)}</strong><small>${escapeHtml(c.armor.notes)} · defense ${c.defense}</small></div><div><span class="label">Pack</span><strong>${escapeHtml(c.packName)}</strong><small>${packs[c.packName].length} starting items</small></div></div></div>
      <div class="sheet-section"><h3>Abilities</h3><div class="story"><div class="story-block"><strong>${escapeHtml(c.arch.trait)}</strong><p>${escapeHtml(c.arch.blurb)}</p></div><div class="story-block"><strong>${escapeHtml(c.talent)}</strong><p>Your chosen archetype talent.</p></div><div class="story-block"><strong>${escapeHtml(c.background)} experience</strong><p>${escapeHtml(backgroundHooks[c.background])}</p></div></div></div>
      <div class="sheet-section"><h3>Skills</h3><div class="skill-sheet">${c.skillRows.map(s=>`<div class="skill-line ${s.trained?'trained':''}"><span>${s.trained?'◆':'◇'} ${escapeHtml(s.name)} <small>${s.stat}</small></span><strong>${signed(s.bonus)}</strong></div>`).join('')}</div></div>
      <div class="sheet-section"><h3>Inventory & Loot</h3><div class="inventory-sheet">${c.fullInventory.map(i=>`<span>${escapeHtml(i)}</span>`).join('')}</div></div>
      <div class="sheet-section"><h3>Character</h3><div class="story"><div class="story-block"><strong>Natural strength: ${escapeHtml(c.bestStat)}</strong><p>Your choices made this your strongest attribute.</p></div><div class="story-block"><strong>Bond</strong><p>${escapeHtml(c.bond)}</p></div><div class="story-block"><strong>Complication</strong><p>${escapeHtml(c.complication)}</p></div></div></div>
      <div class="sheet-footer"><button id="printSheet" class="secondary" type="button">🖨️ Print sheet</button><button id="copyJson" class="secondary" type="button">{} Show character JSON</button></div><pre id="characterJson" class="json-output hidden"></pre>`;
    $('#printSheet').addEventListener('click',()=>window.print());
    $('#copyJson').addEventListener('click',()=>{const pre=$('#characterJson');pre.textContent=JSON.stringify(c,null,2);pre.classList.toggle('hidden');$('#copyJson').textContent=pre.classList.contains('hidden')?'{} Show character JSON':'{} Hide character JSON';});
  }
  function forgeCharacter(){ lastCharacter=buildCharacter();renderCharacter(lastCharacter); }
  function quickBuild(){ recommendedBuild();suggestSkills();setRecommendedGear();inventory=[];addInventory(`${pick(['Uncommon','Rare'])}: ${pick(lootTables[pick(['Uncommon','Rare'])])}`);$('#pcName').value=randomName($('#pcAncestry').value);forgeCharacter(); }

  $$('.mode-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.mode-btn').forEach(b=>b.classList.toggle('active',b===btn));const npc=btn.dataset.mode==='npc';$('#npcMode').classList.toggle('hidden',!npc);$('#characterMode').classList.toggle('hidden',npc);}));
  $('#npcForm').addEventListener('submit',e=>{e.preventDefault();generateNpc();});
  $('#rerollNpcName').addEventListener('click',()=>{if(!currentNpc)generateNpc();else{currentNpc.name=randomName(currentNpc.ancestry);renderNpc();}});
  $('#characterForm').addEventListener('submit',e=>{e.preventDefault();forgeCharacter();});
  $('#randomPcName').addEventListener('click',()=>{$('#pcName').value=randomName($('#pcAncestry').value);});
  $('#resetStats').addEventListener('click',resetAbilityScores);
  $('#recommendedStats').addEventListener('click',recommendedBuild);
  $('#pcArchetype').addEventListener('change',()=>{renderAbilities();suggestSkills();setRecommendedGear();});
  $('#pcBackground').addEventListener('change',()=>{suggestSkills();populateOriginBoosts();renderStatEditor();});
  $('#randomizeGear').addEventListener('click',randomizeGear);
  $('#quickBuild').addEventListener('click',quickBuild);
  $('#rollLoot').addEventListener('click',rollLoot);
  $('#addCustomItem').addEventListener('click',()=>{addInventory($('#customItem').value);$('#customItem').value='';});
  $('#customItem').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#addCustomItem').click();}});
  $('#inventoryEditor').addEventListener('click',e=>{const b=e.target.closest('.remove-item');if(!b)return;inventory.splice(Number(b.dataset.index),1);renderInventory();});
  $('#skillsEditor').addEventListener('change',e=>{const box=e.target.closest('input[data-skill]');if(!box)return;const name=box.dataset.skill;if(box.checked){if(trainedSkills.size>=4){box.checked=false;return;}trainedSkills.add(name);}else trainedSkills.delete(name);renderSkills();});
  $('#stats').addEventListener('click',e=>{const btn=e.target.closest('.stat-btn');if(!btn)return;const stat=btn.dataset.stat,delta=Number(btn.dataset.delta);if(delta>0&&(stats[stat]>=MAX_BASE_STAT||nextPointCost(stat)>remaining()))return;if(delta<0&&stats[stat]<=MIN_STAT)return;stats[stat]+=delta;renderStatEditor();});
  $('#asiEditor').addEventListener('change',e=>{const select=e.target.closest('.asi-choice');if(!select)return;const level=Number(select.dataset.level),slot=Number(select.dataset.slot);asiChoices[level][slot]=select.value;renderFinalSummary();});
  $('#pcLevel').addEventListener('input',()=>{renderStatEditor();});
  $('#originPlus2').addEventListener('change',()=>{if($('#originPlus2').value===$('#originPlus1').value){const allowed=backgroundAbilityOptions();$('#originPlus1').value=allowed.find(a=>a!==$('#originPlus2').value)||allowed[0];}renderStatEditor();});
  $('#originPlus1').addEventListener('change',()=>{if($('#originPlus1').value===$('#originPlus2').value){const allowed=backgroundAbilityOptions();$('#originPlus2').value=allowed.find(a=>a!==$('#originPlus1').value)||allowed[0];}renderStatEditor();});

  $('#npcResult').innerHTML='<div class="result-empty"><div><span class="big">🎲</span><strong>No NPC yet.</strong><p>Choose a few constraints or embrace chaos, then generate one.</p></div></div>';
  $('#characterResult').innerHTML='<div class="result-empty"><div><span class="big">🛡️</span><strong>Your full character sheet will appear here.</strong><p>Build manually, or hit Quick build everything and start tweaking.</p></div></div>';
  populateOriginBoosts();renderStatEditor();renderSkills();populateGear();renderAbilities();renderInventory();
})();
