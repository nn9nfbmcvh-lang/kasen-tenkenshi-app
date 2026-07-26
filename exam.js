// 本試験モード拡張・難易度／想定出題傾向表示
const QUESTION_META = {
  1:{level:2,label:'標準問題',trend:78},2:{level:1,label:'基本知識',trend:72},3:{level:2,label:'標準問題',trend:75},4:{level:3,label:'本試験レベル',trend:92},5:{level:2,label:'標準問題',trend:70},
  6:{level:2,label:'標準問題',trend:68},7:{level:2,label:'標準問題',trend:82},8:{level:3,label:'本試験レベル',trend:88},9:{level:2,label:'標準問題',trend:66},10:{level:2,label:'標準問題',trend:90},
  11:{level:1,label:'基本知識',trend:72},12:{level:2,label:'標準問題',trend:86},13:{level:2,label:'標準問題',trend:76},14:{level:1,label:'基本知識',trend:74},15:{level:2,label:'標準問題',trend:68},
  16:{level:3,label:'本試験レベル',trend:94},17:{level:1,label:'基本知識',trend:62},18:{level:2,label:'標準問題',trend:70},19:{level:2,label:'標準問題',trend:65},20:{level:2,label:'標準問題',trend:90},
  21:{level:4,label:'応用・ひっかけ',trend:86},22:{level:3,label:'本試験レベル',trend:88},23:{level:4,label:'応用・ひっかけ',trend:72},24:{level:1,label:'基本知識',trend:65},25:{level:2,label:'標準問題',trend:82},
  26:{level:2,label:'標準問題',trend:70},27:{level:1,label:'基本知識',trend:64},28:{level:3,label:'本試験レベル',trend:68},29:{level:1,label:'基本知識',trend:72},30:{level:1,label:'基本知識',trend:66}
};

let examAnswers = {};
let reviewFlags = new Set();
let lastWrongIds = [];
let revealedAnswers = new Set();

function stars(level){ return '★'.repeat(level)+'☆'.repeat(5-level); }

function startQuiz(mode){
  if(mode==='wrong'){
    const ids=loadWrong();
    quiz=QUESTIONS.filter(q=>ids.includes(q.id));
    if(!quiz.length){ alert('復習対象の問題はありません。'); return; }
  } else if(mode==='random10') quiz=shuffle(QUESTIONS).slice(0,10);
  else quiz=shuffle(QUESTIONS);
  index=0; score=0; remaining=5400; answered=false;
  examAnswers={}; reviewFlags=new Set(); revealedAnswers=new Set();
  $('home').classList.add('hidden'); $('result').classList.add('hidden'); $('quiz').classList.remove('hidden');
  clearInterval(timerId); timerId=setInterval(tick,1000); tick(); render();
}

function render(){
  const q=quiz[index];
  const revealed=revealedAnswers.has(q.id);
  const meta=QUESTION_META[q.id]||{level:3,label:'本試験レベル',trend:70};
  $('progress').textContent=`${index+1} / ${quiz.length}`;
  $('category').textContent=q.category;
  $('difficulty').textContent=`難易度：${stars(meta.level)} ${meta.label}`;
  $('trend').textContent=`想定出題傾向：${meta.trend}%`;
  $('question').textContent=q.q;
  const c=$('choices'); c.innerHTML='';
  q.choices.forEach((t,i)=>{
    const n=i+1, b=document.createElement('button');
    b.className='choice'; b.textContent=`${n}. ${t}`;
    if(examAnswers[q.id]===n) b.classList.add('selected');
    if(revealed && n===q.answer) b.classList.add('correct');
    if(revealed && examAnswers[q.id]===n && n!==q.answer) b.classList.add('wrong');
    b.disabled=revealed;
    b.onclick=()=>selectAnswer(n); c.appendChild(b);
  });
  const revealBtn=$('revealAnswerBtn');
  revealBtn.classList.remove('hidden');
  revealBtn.disabled=!examAnswers[q.id]||revealed;
  revealBtn.textContent=revealed?'回答表示済み':'回答を表示';
  if(revealed){
    const selected=examAnswers[q.id];
    $('feedback').innerHTML=`<strong>${selected===q.answer?'正解':'不正解'}（正解：${q.answer}）</strong><br>${q.explanation}`;
    $('feedback').classList.remove('hidden');
  } else {
    $('feedback').classList.add('hidden');
  }
  $('prevBtn').disabled=index===0;
  $('nextBtn').textContent=index===quiz.length-1?'採点へ':'次へ';
  $('reviewCheck').checked=reviewFlags.has(q.id);
  renderNavigator();
}

function selectAnswer(n){
  const q=quiz[index];
  if(revealedAnswers.has(q.id)) return;
  examAnswers[q.id]=n;
  [...document.querySelectorAll('.choice')].forEach((b,i)=>b.classList.toggle('selected',i+1===n));
  $('revealAnswerBtn').disabled=false;
  renderNavigator();
}
function revealAnswer(){
  const q=quiz[index], selected=examAnswers[q.id];
  if(!selected){ alert('回答を選択してください。'); return; }
  revealedAnswers.add(q.id);
  render();
}
function previousQuestion(){ if(index>0){ index--; render(); } }
function nextQuestion(){ if(index<quiz.length-1){ index++; render(); } else confirmFinish(); }
function toggleReview(){
  const id=quiz[index].id;
  if($('reviewCheck').checked) reviewFlags.add(id); else reviewFlags.delete(id);
  renderNavigator();
}
function jumpQuestion(i){ index=i; render(); }
function renderNavigator(){
  const nav=$('questionNav'); nav.innerHTML='';
  quiz.forEach((q,i)=>{
    const b=document.createElement('button'); b.className='qnum'; b.textContent=i+1;
    if(examAnswers[q.id]) b.classList.add('answered');
    if(reviewFlags.has(q.id)) b.classList.add('review');
    if(i===index) b.classList.add('current');
    b.onclick=()=>jumpQuestion(i); nav.appendChild(b);
  });
}
function confirmFinish(){
  const unanswered=quiz.filter(q=>!examAnswers[q.id]).length;
  if(confirm(`試験を終了して採点しますか？\n未回答：${unanswered}問\n見直し：${reviewFlags.size}問`)) finish();
}
function finish(){
  clearInterval(timerId); score=0; lastWrongIds=[];
  quiz.forEach(q=>{ if(examAnswers[q.id]===q.answer) score++; else lastWrongIds.push(q.id); });
  saveWrong(lastWrongIds);
  $('quiz').classList.add('hidden'); $('result').classList.remove('hidden');
  const pct=Math.round(score/quiz.length*100), cls=pct>=60?'pass':'fail';
  $('score').innerHTML=`<span class="${cls}">${score} / ${quiz.length}問（${pct}%）</span><br><small>終了後に一括採点</small>`;
  $('resultDetails').innerHTML=`<p>誤答・未回答：${lastWrongIds.length}問</p><p>見直し指定：${reviewFlags.size}問</p>`;
  $('retryWrongBtn').disabled=lastWrongIds.length===0; updateStats();
}
function retryLastWrong(){
  if(!lastWrongIds.length){ alert('誤答問題はありません。'); return; }
  saveWrong(lastWrongIds); startQuiz('wrong');
}
