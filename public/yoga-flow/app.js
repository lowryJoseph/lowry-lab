const $ = (id) => document.getElementById(id);

const POSES = {
  mountain:{name:'Mountain Pose',instruction:'Stand tall with feet grounded, ribs relaxed, and shoulders easy.',side:'',type:'hold'},
  fold:{name:'Forward Fold',instruction:'Hinge forward with soft knees. Let the head and neck relax.',side:'',type:'hold'},
  halfLift:{name:'Half Lift',instruction:'Lengthen the spine with hands on shins or thighs.',side:'',type:'dynamic'},
  downDog:{name:'Downward Dog',instruction:'Press the floor away, keep knees soft, and lengthen through the spine.',side:'',type:'hold'},
  lowLungeL:{name:'Low Lunge',instruction:'Left foot forward. Keep the front knee comfortable and let the hips settle.',side:'LEFT SIDE',type:'hold'},
  lowLungeR:{name:'Low Lunge',instruction:'Right foot forward. Keep the front knee comfortable and let the hips settle.',side:'RIGHT SIDE',type:'hold'},
  halfSplitL:{name:'Half Split',instruction:'Shift hips back over the right knee and lengthen the left leg without forcing it straight.',side:'LEFT LEG',type:'hold'},
  halfSplitR:{name:'Half Split',instruction:'Shift hips back over the left knee and lengthen the right leg without forcing it straight.',side:'RIGHT LEG',type:'hold'},
  warrior1L:{name:'Warrior I',instruction:'Left foot forward. Square comfortably toward the front and reach upward.',side:'LEFT SIDE',type:'hold'},
  warrior1R:{name:'Warrior I',instruction:'Right foot forward. Square comfortably toward the front and reach upward.',side:'RIGHT SIDE',type:'hold'},
  calfL:{name:'Runner Calf Stretch',instruction:'Left leg back, heel reaching down. Keep the stretch gentle.',side:'LEFT CALF',type:'hold'},
  calfR:{name:'Runner Calf Stretch',instruction:'Right leg back, heel reaching down. Keep the stretch gentle.',side:'RIGHT CALF',type:'hold'},
  pigeonL:{name:'Figure-Four / Pigeon Variation',instruction:'Set up a comfortable left-side hip stretch. Use a figure-four position if pigeon is too intense.',side:'LEFT HIP',type:'hold'},
  pigeonR:{name:'Figure-Four / Pigeon Variation',instruction:'Set up a comfortable right-side hip stretch. Use a figure-four position if pigeon is too intense.',side:'RIGHT HIP',type:'hold'},
  child:{name:"Child's Pose",instruction:'Sit hips back as comfortable and let the breath slow down.',side:'',type:'hold'},
  catCow:{name:'Cat–Cow',instruction:'Move slowly between gentle spinal flexion and extension with your breath.',side:'',type:'dynamic'},
  birdDog:{name:'Bird Dog',instruction:'Alternate opposite arm and leg. Keep the trunk quiet and move with control.',side:'ALTERNATE SIDES',type:'dynamic'},
  supineTwistL:{name:'Supine Twist',instruction:'Let both knees drift left while shoulders stay relaxed.',side:'LEFT',type:'hold'},
  supineTwistR:{name:'Supine Twist',instruction:'Let both knees drift right while shoulders stay relaxed.',side:'RIGHT',type:'hold'},
  kneesChest:{name:'Knees to Chest',instruction:'Hug the knees gently and breathe into the back of the ribs.',side:'',type:'hold'},
  bridge:{name:'Bridge',instruction:'Press through the feet and lift the hips only as high as feels easy.',side:'',type:'dynamic'},
  chair:{name:'Chair Pose',instruction:'Sit the hips back, keep weight balanced through the feet, and reach forward or up.',side:'',type:'hold'},
  warrior2L:{name:'Warrior II',instruction:'Left foot forward. Open the torso and reach long through both arms.',side:'LEFT SIDE',type:'hold'},
  warrior2R:{name:'Warrior II',instruction:'Right foot forward. Open the torso and reach long through both arms.',side:'RIGHT SIDE',type:'hold'},
  sideAngleL:{name:'Side Angle',instruction:'Left knee bent. Rest forearm lightly on thigh or reach toward the floor.',side:'LEFT SIDE',type:'hold'},
  sideAngleR:{name:'Side Angle',instruction:'Right knee bent. Rest forearm lightly on thigh or reach toward the floor.',side:'RIGHT SIDE',type:'hold'},
  seatedFold:{name:'Seated Forward Fold',instruction:'Reach forward from the hips with knees softly bent as needed.',side:'',type:'hold'},
  butterfly:{name:'Butterfly',instruction:'Bring soles of the feet together and let the knees relax outward.',side:'',type:'hold'},
  easySeat:{name:'Easy Seat + Breathing',instruction:'Sit comfortably, let the shoulders drop, and breathe slowly.',side:'',type:'hold'},
  ankleRocks:{name:'Ankle Rocks',instruction:'Shift gently forward and back through the ankles without forcing range.',side:'ALTERNATE SIDES',type:'dynamic'},
  legSwings:{name:'Leg Swings',instruction:'Use a wall if needed. Swing one leg comfortably, then switch halfway.',side:'BOTH SIDES',type:'dynamic'},
  lungePulse:{name:'Dynamic Lunge',instruction:'Step into a shallow lunge and pulse gently in and out of the range.',side:'ALTERNATE SIDES',type:'dynamic'},
  worldGreatest:{name:"Runner's Lunge + Rotation",instruction:'Step forward, plant the opposite hand, and rotate gently toward the front leg.',side:'ALTERNATE SIDES',type:'dynamic'},
  standingSide:{name:'Standing Side Reach',instruction:'Reach one arm overhead and lengthen through the side body, then switch.',side:'BOTH SIDES',type:'dynamic'}
};

const FLOW_DEFS = {
  'runner-post': {name:'Runner · Post-run', blurb:'Longer, calmer holds for hips, calves, and hamstrings after running.', poses:['mountain','fold','lowLungeL','lowLungeR','halfSplitL','halfSplitR','calfL','calfR','pigeonL','pigeonR','downDog','child']},
  'runner-pre': {name:'Runner · Pre-run', blurb:'Dynamic mobility to warm ankles, hips, and legs without long static holds.', poses:['mountain','ankleRocks','legSwings','lungePulse','worldGreatest','chair','standingSide','mountain']},
  back: {name:'Gentle Back Mobility', blurb:'Low-intensity movement for the spine, hips, and trunk. Stay inside a comfortable range.', poses:['easySeat','catCow','birdDog','child','bridge','kneesChest','supineTwistL','supineTwistR','easySeat']},
  full: {name:'Full Body', blurb:'A balanced flow through legs, hips, spine, shoulders, and breathing.', poses:['mountain','fold','halfLift','downDog','lowLungeL','warrior1L','warrior2L','lowLungeR','warrior1R','warrior2R','butterfly','child']},
  morning: {name:'Morning', blurb:'Gentle movement that gradually wakes up the spine, hips, and legs.', poses:['easySeat','catCow','downDog','fold','halfLift','chair','lowLungeL','lowLungeR','standingSide','mountain']},
  evening: {name:'Evening', blurb:'Slower holds and quieter movement to transition out of the day.', poses:['easySeat','butterfly','seatedFold','pigeonL','pigeonR','kneesChest','supineTwistL','supineTwistR','child','easySeat']}
};

let selectedGoal='runner-post';
let sequence=[];
let index=0;
let remaining=0;
let initialDuration=1;
let interval=null;
let paused=false;
let startedAt=0;

function fmt(sec){ sec=Math.max(0,Math.round(sec)); return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; }

function buildSequence(){
  const def=FLOW_DEFS[selectedGoal];
  const targetMinutes=Number($('duration').value);
  const items=def.poses.map(id=>({...POSES[id],id}));
  const dynamicWeight = selectedGoal==='runner-pre' ? 0.75 : 1;
  const baseWeights=items.map(p=>p.type==='dynamic'?dynamicWeight:1);
  const totalWeight=baseWeights.reduce((a,b)=>a+b,0);
  const totalSeconds=targetMinutes*60;
  sequence=items.map((p,i)=>{
    let seconds=Math.round((totalSeconds*baseWeights[i]/totalWeight)/5)*5;
    seconds=Math.max(selectedGoal==='runner-pre'?20:25,seconds);
    return {...p,seconds};
  });
  // Correct rounding so displayed sequence roughly matches the selected duration.
  const delta=totalSeconds-sequence.reduce((s,p)=>s+p.seconds,0);
  if(sequence.length) sequence[sequence.length-1].seconds=Math.max(20,sequence[sequence.length-1].seconds+delta);
  renderSummary(); renderPreview();
}

function renderSummary(){
  const d=FLOW_DEFS[selectedGoal];
  $('flowSummary').innerHTML=`<strong>${d.name}</strong> · ${$('duration').value} min · ${sequence.length} movements<br>${d.blurb}`;
}

function renderPreview(){
  $('previewList').innerHTML=sequence.map((p,i)=>`<li><span class="num">${i+1}</span><div><strong>${p.name}${p.side?` · ${p.side}`:''}</strong><small>${p.instruction}</small></div><time>${fmt(p.seconds)}</time></li>`).join('');
}

function speak(text){
  if(!$('voicePlayer').checked || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.rate=.95;u.pitch=1;u.volume=.9;speechSynthesis.speak(u);
}

function cueFor(p){
  const g=$('guidance').value;
  if(g==='minimal') return `${p.name}${p.side?`, ${p.side.toLowerCase()}`:''}.`;
  if(g==='detailed') return `${p.name}${p.side?`, ${p.side.toLowerCase()}`:''}. ${p.instruction}`;
  return `${p.name}${p.side?`, ${p.side.toLowerCase()}`:''}.`;
}

function startFlow(){
  buildSequence(); index=0; startedAt=Date.now();
  $('setup').classList.add('hidden'); $('complete').classList.add('hidden'); $('player').classList.remove('hidden');
  $('voicePlayer').checked=$('voice').checked;
  loadPose(true);
}

function loadPose(announce=false){
  clearInterval(interval); paused=false; $('pauseBtn').textContent='Pause';
  const p=sequence[index]; remaining=p.seconds; initialDuration=p.seconds;
  $('flowName').textContent=FLOW_DEFS[selectedGoal].name.toUpperCase();
  $('poseName').textContent=p.name; $('instruction').textContent=p.instruction; $('sideLabel').textContent=p.side||'BREATHE';
  $('poseCounter').textContent=`${index+1} / ${sequence.length}`;
  $('nextPose').textContent=index<sequence.length-1 ? `${sequence[index+1].name}${sequence[index+1].side?` · ${sequence[index+1].side}`:''}` : 'Flow complete';
  updateTimer(); if(announce) speak(cueFor(p));
  interval=setInterval(tick,1000);
}

function updateTimer(){
  $('countdown').textContent=fmt(remaining);
  const pct=initialDuration?Math.max(0,Math.min(100,(remaining/initialDuration)*100)):0;
  $('timerRing').style.setProperty('--progress',`${pct}%`);
  const currentPlusFuture=remaining+sequence.slice(index+1).reduce((s,p)=>s+p.seconds,0);
  $('overallTime').textContent=`${fmt(currentPlusFuture)} remaining`;
}

function tick(){
  if(paused)return;
  remaining-=1; updateTimer();
  if(remaining===3) speak('Three.');
  if(remaining<=0){
    if(index>=sequence.length-1){finishFlow();return;}
    index+=1;loadPose(true);
  }
}

function nextPose(){ if(index>=sequence.length-1){finishFlow();return;} index+=1;loadPose(true); }
function prevPose(){ if(index>0){index-=1;loadPose(true);} else {remaining=initialDuration;updateTimer();} }
function finishFlow(){clearInterval(interval);if('speechSynthesis'in window)speechSynthesis.cancel();$('player').classList.add('hidden');$('complete').classList.remove('hidden');$('completeText').textContent=`${$('duration').value} minutes of ${FLOW_DEFS[selectedGoal].name.toLowerCase()} finished.`;speak('Flow complete. Nice work.');}
function resetToSetup(){clearInterval(interval);if('speechSynthesis'in window)speechSynthesis.cancel();$('player').classList.add('hidden');$('complete').classList.add('hidden');$('setup').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});}

document.querySelectorAll('.goal-card').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.goal-card').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');selectedGoal=btn.dataset.goal;buildSequence();}));
$('duration').addEventListener('change',buildSequence);$('guidance').addEventListener('change',buildSequence);$('startBtn').addEventListener('click',startFlow);
$('pauseBtn').addEventListener('click',()=>{paused=!paused;$('pauseBtn').textContent=paused?'Resume':'Pause';if(paused&&'speechSynthesis'in window)speechSynthesis.cancel();});
$('nextBtn').addEventListener('click',nextPose);$('prevBtn').addEventListener('click',prevPose);$('restartPoseBtn').addEventListener('click',()=>loadPose(true));$('endBtn').addEventListener('click',resetToSetup);$('againBtn').addEventListener('click',resetToSetup);
$('voicePlayer').addEventListener('change',()=>{if(!$('voicePlayer').checked&&'speechSynthesis'in window)speechSynthesis.cancel();});
buildSequence();
