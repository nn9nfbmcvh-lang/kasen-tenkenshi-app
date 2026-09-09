const STATS_KEY='hiikawa_quiz_stats_v2';
const ALL_QUESTIONS=QUESTIONS.slice();
const BASE_QUESTIONS=ALL_QUESTIONS.slice(0,30);
const CONSULT_QUESTIONS=ALL_QUESTIONS.slice(30,50);
let runMode='base30',runStartedAt=0,questionShownAt=0,answerTimes=[],currentPlayer='',finishReason='',resultRetryMode='wrongBase';
const nameInput=document.getElementById('playerName');
const start20Btn=document.getElementById('start20Btn');
const retryBaseStart=document.getElementById('retryBaseStart');
const retryConsultStart=document.getElementById('retryConsultStart');
const retryWrongResult=document.getElementById('retryWrongResult');
const wrongInfo=document.getElementById('wrongInfo');
const historyBox=document.getElementById('history');
const resultMeta=document.getElementById('resultMeta');

function qKey(q){return `${q.q}|||${q.source||''}`}
const BASE_KEYS=new Set(BASE_QUESTIONS.map(qKey));
const CONSULT_KEYS=new Set(CONSULT_QUESTIONS.map(qKey));
function loadStats(){
  let s;
  try{s=JSON.parse(localStorage.getItem(STATS_KEY))||null}catch(e){s=null}
  if(!s){
    try{s=JSON.parse(localStorage.getItem('hiikawa_quiz_stats_v1'))||null}catch(e){s=null}
  }
  if(!s)s={lastName:'',players:{}};
  if(!s.players)s.players={};
  Object.keys(s.players).forEach(name=>migratePlayer(s.players[name]));
  return s;
}
function saveStats(s){localStorage.setItem(STATS_KEY,JSON.stringify(s))}
function migratePlayer(p){
  if(!Array.isArray(p.attempts))p.attempts=[];
  if(!p.wrongByMode)p.wrongByMode={base30:[],consult20:[]};
  if(!Array.isArray(p.wrongByMode.base30))p.wrongByMode.base30=[];
  if(!Array.isArray(p.wrongByMode.consult20))p.wrongByMode.consult20=[];
  if(Array.isArray(p.wrongKeys)&&p.wrongKeys.length){
    if(!p.wrongByMode.base30.length)p.wrongByMode.base30=p.wrongKeys.filter(k=>BASE_KEYS.has(k));
    if(!p.wrongByMode.consult20.length)p.wrongByMode.consult20=p.wrongKeys.filter(k=>CONSULT_KEYS.has(k));
  }
  return p;
}
function getPlayer(s,name){
  if(!s.players[name])s.players[name]={attempts:[],wrongByMode:{base30:[],consult20:[]}};
  return migratePlayer(s.players[name]);
}
function fmtTime(ms){const sec=Math.max(0,Math.round(ms/1000)),m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')}`}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function playerName(){return nameInput.value.trim()}
function familyForMode(mode){return mode==='consult20'||mode==='wrongConsult'?'consult20':'base30'}
function modeLabel(mode){return ({base30:'基本30',consult20:'協議20',wrongBase:'復習30',wrongConsult:'復習20'})[mode]||mode}
function sourceForMode(mode,name){
  if(mode==='base30')return BASE_QUESTIONS;
  if(mode==='consult20')return CONSULT_QUESTIONS;
  const s=loadStats(),p=getPlayer(s,name);
  if(mode==='wrongBase'){const set=new Set(p.wrongByMode.base30);return BASE_QUESTIONS.filter(q=>set.has(qKey(q)))}
  if(mode==='wrongConsult'){const set=new Set(p.wrongByMode.consult20);return CONSULT_QUESTIONS.filter(q=>set.has(qKey(q)))}
  return [];
}
function buildQuizFrom(source){return source.map(q=>{const opts=q.choices.map((text,i)=>({text,correct:q.answers.includes(i)}));return {...q,_key:qKey(q),opts:shuffle(opts)}})}
function updateWrongButtons(){
  const name=playerName(),s=loadStats(),p=name&&s.players[name]?getPlayer(s,name):null;
  const b=p?p.wrongByMode.base30.length:0,c=p?p.wrongByMode.consult20.length:0;
  retryBaseStart.disabled=b===0;retryConsultStart.disabled=c===0;
  retryBaseStart.textContent=b?`基本30問の間違い ${b}問`:'基本30問の間違いだけ';
  retryConsultStart.textContent=c?`協議・指示20問の間違い ${c}問`:'協議・指示20問の間違いだけ';
  wrongInfo.textContent=name?`保存中の間違い：基本 ${b}問 ／ 協議・指示 ${c}問`:'名前を入力すると学習履歴を表示します。';
}
function renderHistory(){
  const name=playerName(),s=loadStats();
  if(!name||!s.players[name]||!getPlayer(s,name).attempts.length){historyBox.innerHTML='';updateWrongButtons();return}
  const rows=getPlayer(s,name).attempts.slice(0,6).map(a=>{const d=new Date(a.date),date=`${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;return `<div class="histRow"><span>${date}</span><span>${modeLabel(a.mode)}</span><b>${a.rate}%</b><span>${fmtTime(a.elapsedMs)}</span></div>`}).join('');
  historyBox.innerHTML=`<div class="historyTitle">最近の結果</div><div class="histHead"><span>日時</span><span>区分</span><span>正解率</span><span>時間</span></div>${rows}`;updateWrongButtons();
}
function requireName(){const name=playerName();if(!name){nameInput.focus();alert('名前を入力してください。');return null}return name}
function startQuizMode(mode){
  const name=requireName();if(!name)return;const source=sourceForMode(mode,name);
  if(!source.length){alert('この区分に保存されている間違い問題はありません。');updateWrongButtons();return}
  currentPlayer=name;runMode=mode;finishReason='';
  const s=loadStats();s.lastName=name;getPlayer(s,name);saveStats(s);
  quiz=buildQuizFrom(source);idx=0;score=0;results=[];selectedIndices=[];answerTimes=[];timeLeft=300;done=false;answered=false;
  clearInterval(timerId);el.start.style.display='none';el.result.style.display='none';el.quiz.style.display='block';runStartedAt=Date.now();updateTimer();timerId=setInterval(tick,1000);show();
}
show=function(){
  answered=false;const q=quiz[idx];questionShownAt=performance.now();el.counter.textContent=`${idx+1} / ${quiz.length}問`;el.scoreMini.textContent=`回答済み ${results.filter(v=>v!==undefined).length}問`;el.bar.style.width=`${idx/quiz.length*100}%`;el.question.textContent=q.q;el.images.innerHTML='';
  if(q.images&&q.images.length){el.images.style.display='grid';q.images.forEach(src=>{const img=new Image();img.src=src;img.alt='問題画像';el.images.appendChild(img)})}else el.images.style.display='none';
  el.choices.innerHTML='';el.feedback.className='feedback';el.feedback.innerHTML='';const prior=selectedIndices[idx];
  q.opts.forEach((opt,i)=>{const b=document.createElement('button');b.className='choice';b.textContent=opt.text;if(i===prior){b.style.background='#eef3f8';b.style.borderColor='#315b88'}b.onclick=()=>answer(b,opt.correct,i);el.choices.appendChild(b)});
  el.next.textContent=idx===quiz.length-1?'結果を見る':'次の問題';el.next.style.display=prior===undefined?'none':'inline-block';backBtn.style.visibility=idx>0?'visible':'hidden';
};
answer=function(btn,isCorrect,optIndex){
  if(done)return;if(answerTimes[idx]===undefined)answerTimes[idx]=Math.max(0,Math.round(performance.now()-questionShownAt));if(results[idx]===true)score--;results[idx]=isCorrect;if(isCorrect)score++;selectedIndices[idx]=optIndex;
  [...el.choices.children].forEach(b=>{b.style.background='#fff';b.style.borderColor='#d5d8dc'});btn.style.background='#eef3f8';btn.style.borderColor='#315b88';answered=true;el.scoreMini.textContent=`回答済み ${results.filter(v=>v!==undefined).length}問`;el.next.style.display='inline-block';
};
finish=function(reason='complete'){
  if(done)return;done=true;clearInterval(timerId);finishReason=reason===true?'timeout':reason;for(let i=0;i<quiz.length;i++)if(results[i]===undefined)results[i]=false;score=results.filter(Boolean).length;
  const elapsedMs=Math.min(300000,Math.max(0,Date.now()-runStartedAt)),answeredCount=selectedIndices.filter(v=>v!==undefined).length,rate=quiz.length?Math.round(score/quiz.length*1000)/10:0,timed=answerTimes.filter(v=>Number.isFinite(v)),avgMs=timed.length?Math.round(timed.reduce((a,b)=>a+b,0)/timed.length):0,wrongKeys=quiz.filter((q,i)=>!results[i]).map(q=>q._key||qKey(q));
  const s=loadStats(),p=getPlayer(s,currentPlayer||playerName()),family=familyForMode(runMode);p.wrongByMode[family]=wrongKeys;p.attempts.unshift({date:new Date().toISOString(),mode:runMode,total:quiz.length,correct:score,rate,elapsedMs,answered:answeredCount,avgMs,wrongCount:wrongKeys.length});p.attempts=p.attempts.slice(0,50);s.lastName=currentPlayer||playerName();saveStats(s);
  el.quiz.style.display='none';el.result.style.display='block';el.finalScore.textContent=`${score} / ${quiz.length}`;el.comment.textContent=finishReason==='timeout'?'5分経過しました。未回答は✕です。':finishReason==='quit'?'途中終了しました。未回答は✕です。':'';
  const category=family==='base30'?'基本問題30問':'協議・指示20問';resultMeta.innerHTML=`<div><b>${esc(currentPlayer)}</b> ／ ${category}</div><div class="metrics"><span>正解率 <b>${rate}%</b></span><span>回答時間 <b>${fmtTime(elapsedMs)}</b></span><span>平均 <b>${avgMs?`${(avgMs/1000).toFixed(1)}秒/問`:'—'}</b></span></div>`;
  el.review.innerHTML='<h3>回答結果一覧</h3>'+quiz.map((q,i)=>`<div class="row"><div>問${i+1}</div><div class="mark ${results[i]?'ok':'ng'}">${results[i]?'◯':'✕'}</div><div>${esc(q.q)}</div></div>`).join('');
  resultRetryMode=family==='base30'?'wrongBase':'wrongConsult';retryWrongResult.disabled=wrongKeys.length===0;retryWrongResult.textContent=wrongKeys.length?`この区分の間違い ${wrongKeys.length}問だけ解く`:'全問正解';nameInput.value=currentPlayer;renderHistory();
};
el.next.onclick=()=>{if(selectedIndices[idx]===undefined)return;idx++;idx>=quiz.length?finish('complete'):show()};
backBtn.onclick=()=>{if(idx<=0||done)return;idx--;show()};
quitBtn.onclick=()=>{if(done)return;finish('quit')};
el.startBtn.onclick=()=>startQuizMode('base30');
start20Btn.onclick=()=>startQuizMode('consult20');
retryBaseStart.onclick=()=>startQuizMode('wrongBase');
retryConsultStart.onclick=()=>startQuizMode('wrongConsult');
retryWrongResult.onclick=()=>{if(!retryWrongResult.disabled)startQuizMode(resultRetryMode)};
el.restart.onclick=()=>{el.result.style.display='none';el.start.style.display='block';el.timer.classList.remove('warn');renderHistory()};
nameInput.addEventListener('input',renderHistory);
const stored=loadStats();if(stored.lastName)nameInput.value=stored.lastName;renderHistory();