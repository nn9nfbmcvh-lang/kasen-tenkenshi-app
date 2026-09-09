const STATS_KEY='hiikawa_quiz_stats_v1';
const ALL_QUESTIONS=QUESTIONS.slice();
let runMode='all',runStartedAt=0,questionShownAt=0,answerTimes=[],currentPlayer='',finishReason='';
const nameInput=document.getElementById('playerName');
const retryWrongStart=document.getElementById('retryWrongStart');
const retryWrongResult=document.getElementById('retryWrongResult');
const wrongInfo=document.getElementById('wrongInfo');
const historyBox=document.getElementById('history');
const resultMeta=document.getElementById('resultMeta');

function loadStats(){
  try{return JSON.parse(localStorage.getItem(STATS_KEY))||{lastName:'',players:{}}}
  catch(e){return {lastName:'',players:{}}}
}
function saveStats(s){localStorage.setItem(STATS_KEY,JSON.stringify(s))}
function getPlayer(s,name){
  if(!s.players[name])s.players[name]={attempts:[],wrongKeys:[]};
  return s.players[name];
}
function qKey(q){return `${q.q}|||${q.source||''}`}
function fmtTime(ms){
  const sec=Math.max(0,Math.round(ms/1000));
  const m=Math.floor(sec/60),s=sec%60;
  return `${m}:${String(s).padStart(2,'0')}`;
}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function playerName(){return nameInput.value.trim()}
function sourceForMode(mode,name){
  if(mode==='all')return ALL_QUESTIONS;
  const s=loadStats(),p=getPlayer(s,name),set=new Set(p.wrongKeys||[]);
  return ALL_QUESTIONS.filter(q=>set.has(qKey(q)));
}
function buildQuizFrom(source){
  return source.map(q=>{
    const opts=q.choices.map((text,i)=>({text,correct:q.answers.includes(i)}));
    return {...q,_key:qKey(q),opts:shuffle(opts)};
  });
}
function updateWrongButtons(){
  const name=playerName(),s=loadStats();
  const p=name&&s.players[name]?s.players[name]:null;
  const n=p&&Array.isArray(p.wrongKeys)?p.wrongKeys.length:0;
  retryWrongStart.disabled=n===0;
  retryWrongStart.textContent=n?`間違えた${n}問だけ解く`:'間違えた問題だけ解く';
  wrongInfo.textContent=name?(n?`保存中の間違い：${n}問`:'保存中の間違いはありません。'):'名前を入力すると学習履歴を表示します。';
}
function renderHistory(){
  const name=playerName(),s=loadStats();
  if(!name||!s.players[name]||!s.players[name].attempts.length){historyBox.innerHTML='';updateWrongButtons();return}
  const rows=s.players[name].attempts.slice(0,5).map(a=>{
    const d=new Date(a.date);
    const date=`${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const mode=a.mode==='wrong'?'復習':'全問';
    return `<div class="histRow"><span>${date}</span><span>${mode}</span><b>${a.rate}%</b><span>${fmtTime(a.elapsedMs)}</span></div>`;
  }).join('');
  historyBox.innerHTML=`<div class="historyTitle">最近の結果</div><div class="histHead"><span>日時</span><span>モード</span><span>正解率</span><span>時間</span></div>${rows}`;
  updateWrongButtons();
}
function requireName(){
  const name=playerName();
  if(!name){nameInput.focus();alert('名前を入力してください。');return null}
  return name;
}
function startQuizMode(mode){
  const name=requireName();if(!name)return;
  const source=sourceForMode(mode,name);
  if(!source.length){alert('保存されている間違い問題はありません。');updateWrongButtons();return}
  currentPlayer=name;runMode=mode;finishReason='';
  const s=loadStats();s.lastName=name;getPlayer(s,name);saveStats(s);
  quiz=buildQuizFrom(source);idx=0;score=0;results=[];selectedIndices=[];answerTimes=[];timeLeft=300;done=false;answered=false;
  clearInterval(timerId);el.start.style.display='none';el.result.style.display='none';el.quiz.style.display='block';
  runStartedAt=Date.now();updateTimer();timerId=setInterval(tick,1000);show();
}
show=function(){
  answered=false;const q=quiz[idx];questionShownAt=performance.now();
  el.counter.textContent=`${idx+1} / ${quiz.length}問`;
  el.scoreMini.textContent=`回答済み ${results.filter(v=>v!==undefined).length}問`;
  el.bar.style.width=`${idx/quiz.length*100}%`;el.question.textContent=q.q;el.images.innerHTML='';
  if(q.images&&q.images.length){el.images.style.display='grid';q.images.forEach(src=>{const img=new Image();img.src=src;img.alt='問題画像';el.images.appendChild(img)})}else el.images.style.display='none';
  el.choices.innerHTML='';el.feedback.className='feedback';el.feedback.innerHTML='';
  const prior=selectedIndices[idx];
  q.opts.forEach((opt,i)=>{const b=document.createElement('button');b.className='choice';b.textContent=opt.text;if(i===prior){b.style.background='#eef3f8';b.style.borderColor='#315b88'}b.onclick=()=>answer(b,opt.correct,i);el.choices.appendChild(b)});
  el.next.textContent=idx===quiz.length-1?'結果を見る':'次の問題';el.next.style.display=prior===undefined?'none':'inline-block';
  backBtn.style.visibility=idx>0?'visible':'hidden';
};
answer=function(btn,isCorrect,optIndex){
  if(done)return;
  if(answerTimes[idx]===undefined)answerTimes[idx]=Math.max(0,Math.round(performance.now()-questionShownAt));
  if(results[idx]===true)score--;results[idx]=isCorrect;if(isCorrect)score++;
  selectedIndices[idx]=optIndex;
  [...el.choices.children].forEach(b=>{b.style.background='#fff';b.style.borderColor='#d5d8dc'});btn.style.background='#eef3f8';btn.style.borderColor='#315b88';
  answered=true;el.scoreMini.textContent=`回答済み ${results.filter(v=>v!==undefined).length}問`;el.next.style.display='inline-block';
};
finish=function(reason='complete'){
  if(done)return;done=true;clearInterval(timerId);finishReason=reason===true?'timeout':reason;
  for(let i=0;i<quiz.length;i++)if(results[i]===undefined)results[i]=false;
  score=results.filter(Boolean).length;
  const elapsedMs=Math.min(300000,Math.max(0,Date.now()-runStartedAt));
  const answeredCount=selectedIndices.filter(v=>v!==undefined).length;
  const rate=quiz.length?Math.round(score/quiz.length*1000)/10:0;
  const timed=answerTimes.filter(v=>Number.isFinite(v));
  const avgMs=timed.length?Math.round(timed.reduce((a,b)=>a+b,0)/timed.length):0;
  const wrongKeys=quiz.filter((q,i)=>!results[i]).map(q=>q._key||qKey(q));
  const s=loadStats(),p=getPlayer(s,currentPlayer||playerName());
  p.wrongKeys=wrongKeys;
  p.attempts.unshift({date:new Date().toISOString(),mode:runMode,total:quiz.length,correct:score,rate,elapsedMs,answered:answeredCount,avgMs,wrongCount:wrongKeys.length});
  p.attempts=p.attempts.slice(0,50);s.lastName=currentPlayer||playerName();saveStats(s);
  el.quiz.style.display='none';el.result.style.display='block';el.finalScore.textContent=`${score} / ${quiz.length}`;
  const reasonText=finishReason==='timeout'?'5分経過しました。未回答は✕です。':finishReason==='quit'?'途中終了しました。未回答は✕です。':'';
  el.comment.textContent=reasonText;
  resultMeta.innerHTML=`<div><b>${esc(currentPlayer)}</b></div><div class="metrics"><span>正解率 <b>${rate}%</b></span><span>回答時間 <b>${fmtTime(elapsedMs)}</b></span><span>平均 <b>${avgMs?`${(avgMs/1000).toFixed(1)}秒/問`:'—'}</b></span></div>`;
  el.review.innerHTML='<h3>回答結果一覧</h3>'+quiz.map((q,i)=>`<div class="row"><div>問${i+1}</div><div class="mark ${results[i]?'ok':'ng'}">${results[i]?'◯':'✕'}</div><div>${esc(q.q)}</div></div>`).join('');
  retryWrongResult.disabled=wrongKeys.length===0;retryWrongResult.textContent=wrongKeys.length?`間違えた${wrongKeys.length}問だけ解く`:'全問正解';
  nameInput.value=currentPlayer;renderHistory();
};
el.next.onclick=()=>{if(selectedIndices[idx]===undefined)return;idx++;idx>=quiz.length?finish('complete'):show()};
backBtn.onclick=()=>{if(idx<=0||done)return;idx--;show()};
quitBtn.onclick=()=>{if(done)return;finish('quit')};
el.startBtn.onclick=()=>startQuizMode('all');
retryWrongStart.onclick=()=>startQuizMode('wrong');
retryWrongResult.onclick=()=>{if(!retryWrongResult.disabled)startQuizMode('wrong')};
el.restart.onclick=()=>{el.result.style.display='none';el.start.style.display='block';el.timer.classList.remove('warn');renderHistory()};
nameInput.addEventListener('input',renderHistory);
const stored=loadStats();if(stored.lastName)nameInput.value=stored.lastName;renderHistory();
