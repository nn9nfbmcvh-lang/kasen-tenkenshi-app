let selectedIndices=[];
const backBtn=document.getElementById('back');
const quitBtn=document.getElementById('quit');
const originalStartQuiz=startQuiz;
startQuiz=function(){selectedIndices=[];originalStartQuiz()};
el.startBtn.onclick=startQuiz;
show=function(){
  answered=false;
  const q=quiz[idx];
  el.counter.textContent=`${idx+1} / ${quiz.length}問`;
  el.scoreMini.textContent=`回答済み ${results.filter(v=>v!==undefined).length}問`;
  el.bar.style.width=`${idx/quiz.length*100}%`;
  el.question.textContent=q.q;
  el.images.innerHTML='';
  if(q.images&&q.images.length){
    el.images.style.display='grid';
    q.images.forEach(src=>{const img=new Image();img.src=src;img.alt='問題画像';el.images.appendChild(img)});
  }else el.images.style.display='none';
  el.choices.innerHTML='';
  el.feedback.className='feedback';
  el.feedback.innerHTML='';
  const prior=selectedIndices[idx];
  q.opts.forEach((opt,i)=>{
    const b=document.createElement('button');
    b.className='choice';
    b.textContent=opt.text;
    if(i===prior){b.style.background='#eef3f8';b.style.borderColor='#315b88'}
    b.onclick=()=>answer(b,opt.correct,i);
    el.choices.appendChild(b);
  });
  el.next.textContent=idx===quiz.length-1?'結果を見る':'次の問題';
  el.next.style.display=prior===undefined?'none':'inline-block';
  backBtn.style.visibility=idx>0?'visible':'hidden';
};
answer=function(btn,isCorrect,optIndex){
  if(done)return;
  if(results[idx]===true)score--;
  results[idx]=isCorrect;
  if(isCorrect)score++;
  selectedIndices[idx]=optIndex;
  [...el.choices.children].forEach(b=>{b.style.background='#fff';b.style.borderColor='#d5d8dc'});
  btn.style.background='#eef3f8';
  btn.style.borderColor='#315b88';
  answered=true;
  el.scoreMini.textContent=`回答済み ${results.filter(v=>v!==undefined).length}問`;
  el.next.textContent=idx===quiz.length-1?'結果を見る':'次の問題';
  el.next.style.display='inline-block';
};
el.next.onclick=()=>{
  if(selectedIndices[idx]===undefined)return;
  idx++;
  idx>=quiz.length?finish():show();
};
backBtn.onclick=()=>{
  if(idx<=0||done)return;
  idx--;
  show();
};
quitBtn.onclick=()=>{
  if(done)return;
  finish();
  el.comment.textContent='途中終了しました。未回答は✕として集計しました。';
};
