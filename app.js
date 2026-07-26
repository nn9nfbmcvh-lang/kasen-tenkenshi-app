
const APP_PASSWORD='4151';
const INTRO_TEXT='今日も一緒に、河川を見る目を鍛えよう！';
let introTimer=null, typeTimer=null;
function unlockApp(){
  const v=$('passwordInput').value;
  if(v!==APP_PASSWORD){ alert('パスワードが違います。'); return; }
  sessionStorage.setItem('unlocked','1');
  $('login').classList.add('hidden');
  showIntro();
}
function initGate(){
  if(sessionStorage.getItem('unlocked')==='1'){
    $('login').classList.add('hidden');
    $('home').classList.remove('hidden');
    updateStats();
    const params=new URLSearchParams(location.search);
    if(params.get('start')==='1') startQuiz('all');
  }
}

function showIntro(){
  clearTimeout(introTimer); clearInterval(typeTimer);
  $('home').classList.add('hidden');
  $('introScreen').classList.remove('hidden');
  const message=$('introMessage'); message.textContent='';
  let i=0;
  typeTimer=setInterval(()=>{
    if(i>=INTRO_TEXT.length){ clearInterval(typeTimer); return; }
    message.textContent+=INTRO_TEXT[i++];
  },55);
  introTimer=setTimeout(finishIntro,3000);
}
function finishIntro(){
  if($('introScreen').classList.contains('hidden')) return;
  clearTimeout(introTimer); clearInterval(typeTimer);
  $('introMessage').textContent=INTRO_TEXT;
  $('introScreen').classList.add('hidden');
  $('home').classList.remove('hidden');
  updateStats();
  const params=new URLSearchParams(location.search);
  if(params.get('start')==='1') startQuiz('all');
}
function confirmEndLearning(){
  if(confirm('学習を終了しますか？')) showOutro();
}
function showOutro(){
  clearInterval(timerId);
  $('home').classList.add('hidden');
  $('quiz').classList.add('hidden');
  $('result').classList.add('hidden');
  $('outroScreen').classList.remove('hidden');
  $('timer').textContent='90:00';
}
function returnFromOutro(){
  $('outroScreen').classList.add('hidden');
  showHome();
}
document.getElementById('introScreen').addEventListener('click',finishIntro);
document.getElementById('introScreen').addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '){ e.preventDefault(); finishIntro(); }
});


const QUESTIONS = [{"id": 1, "category": "堤防", "q": "堤防天端に長いひび割れが確認された。最も優先して確認すべき事項はどれか。", "choices": ["ひび割れの幅・長さ・段差", "草の高さ", "河川名", "天候"], "answer": 1, "explanation": "ひび割れは幅・長さ・段差・進行性を確認し、不同沈下やすべりの兆候を把握します。"}, {"id": 2, "category": "護岸", "q": "護岸ブロックの欠損・脱落が確認された。変状として最も適切なのはどれか。", "choices": ["ブロックの欠損・脱落", "パイピング", "動物の巣穴", "樹木繁茂"], "answer": 1, "explanation": "護岸材そのものが失われているため、欠損・脱落です。"}, {"id": 3, "category": "樋門・樋管", "q": "樋門・樋管で最も重要な点検項目はどれか。", "choices": ["塗装の色", "ゲートの開閉機能", "銘板の大きさ", "周囲の雑草"], "answer": 2, "explanation": "出水時に確実に操作できることが最重要です。"}, {"id": 4, "category": "堤防", "q": "堤防法面に濁った湧水が確認された。最も疑われる現象はどれか。", "choices": ["乾燥収縮", "パイピング", "凍害", "塩害"], "answer": 2, "explanation": "濁水や砂の噴出を伴う漏水は、土粒子流出を伴うパイピングが疑われます。"}, {"id": 5, "category": "河道", "q": "樹木繁茂で最も問題となる理由はどれか。", "choices": ["景観が悪くなる", "河積阻害や点検障害になる", "鳥が増える", "日陰ができる"], "answer": 2, "explanation": "洪水流下能力の低下や、変状の見落としにつながります。"}, {"id": 6, "category": "堤防", "q": "動物の巣穴で最も懸念されることはどれか。", "choices": ["堤防内部の空洞化", "草刈りが大変", "景観悪化", "排水不良"], "answer": 1, "explanation": "堤体内の空洞化や浸透経路の形成につながるおそれがあります。"}, {"id": 7, "category": "洗掘", "q": "橋脚周辺の洗掘で最も危険なのはどれか。", "choices": ["河床が高くなる", "基礎が露出し安定性が低下する", "水質が悪化する", "草が増える"], "answer": 2, "explanation": "洗掘により支持地盤が失われ、構造物の安定性が低下します。"}, {"id": 8, "category": "護岸", "q": "護岸ブロックが沈下している。最も疑われる原因はどれか。", "choices": ["裏込材の流出", "雑草", "塗装劣化", "日射"], "answer": 1, "explanation": "目地等から裏込材が吸い出され、背面が空洞化すると沈下が起こります。"}, {"id": 9, "category": "河道", "q": "流木が大量に堆積している場合、最も懸念されることはどれか。", "choices": ["河積阻害による水位上昇", "水温低下", "魚が増える", "景観向上"], "answer": 1, "explanation": "橋脚や狭窄部で流下断面を阻害し、水位上昇を招きます。"}, {"id": 10, "category": "緊急度", "q": "河川点検で緊急度が最も高い変状はどれか。", "choices": ["小さな雑草の繁茂", "表面の軽微な変色", "パイピングによる砂の噴出", "軽微な汚れ"], "answer": 3, "explanation": "砂を伴う噴出は堤体材料の流出を示し、決壊につながるおそれがあります。"}, {"id": 11, "category": "堤防", "q": "堤防天端の一部が低くなっている。この変状として最も適切なのはどれか。", "choices": ["沈下", "洗掘", "吸い出し", "樹木繁茂"], "answer": 1, "explanation": "天端高の低下は沈下として整理します。"}, {"id": 12, "category": "洗掘", "q": "護岸前面の河床が削られ、基礎が見えている。この現象はどれか。", "choices": ["吸い出し", "洗掘", "パイピング", "沈下"], "answer": 2, "explanation": "流水により河床や護岸前面が削られる現象が洗掘です。"}, {"id": 13, "category": "樋門・樋管", "q": "樋門・樋管で止水性能に直接影響する部材はどれか。", "choices": ["銘板", "止水ゴム", "手すり", "塗装"], "answer": 2, "explanation": "止水ゴムの劣化は漏水に直結します。"}, {"id": 14, "category": "点検", "q": "洪水後の点検で最優先に確認するものはどれか。", "choices": ["樹木の種類", "堤防・護岸の変状", "管理境界杭", "案内看板"], "answer": 2, "explanation": "出水による損傷や異常の早期発見が最優先です。"}, {"id": 15, "category": "堤防", "q": "動物の巣穴を発見した場合、最も懸念されることはどれか。", "choices": ["堤防内部の空洞化", "景観悪化", "雑草増加", "河床上昇"], "answer": 1, "explanation": "堤体内の空洞や水みち形成が懸念されます。"}, {"id": 16, "category": "緊急度", "q": "堤防法面から濁水と砂が噴き出している。最も緊急性が高い現象はどれか。", "choices": ["洗掘", "パイピング", "クラック", "樹木繁茂"], "answer": 2, "explanation": "砂を伴う漏水はパイピングの代表的兆候です。"}, {"id": 17, "category": "法令", "q": "河川区域を管理する者として正しいのはどれか。", "choices": ["市町村長", "河川管理者", "消防署", "警察署"], "answer": 2, "explanation": "河川区域は河川管理者が管理します。"}, {"id": 18, "category": "護岸", "q": "コンクリート護岸のひび割れで、特に注意すべき確認項目はどれか。", "choices": ["ひび割れ幅・長さ・進行状況", "色", "写真の枚数", "河川名"], "answer": 1, "explanation": "ひび割れの規模と進行性を記録し、構造への影響を判断します。"}, {"id": 19, "category": "河道", "q": "流木が橋脚に大量に引っ掛かっている。最も懸念されることはどれか。", "choices": ["流水阻害による水位上昇", "水質改善", "魚類増加", "景観向上"], "answer": 1, "explanation": "閉塞により上流水位が上昇し、越水等の危険が増します。"}, {"id": 20, "category": "緊急度", "q": "河川点検で最も危険度が高い変状はどれか。", "choices": ["小さな草の繁茂", "軽微な変色", "パイピング", "塗装劣化"], "answer": 3, "explanation": "パイピングは堤防決壊につながる重大変状です。"}, {"id": 21, "category": "堤防", "q": "堤防法面から透明な水だけが湧いている。砂の流出はない。最も適切な判断はどれか。", "choices": ["直ちにパイピングと判断する", "漏水の可能性があり継続観察・詳細点検を行う", "異常ではないので放置する", "洗掘と判断する"], "answer": 2, "explanation": "砂流出がなければ直ちにパイピングと断定せず、漏水として量・濁り・拡大を監視します。"}, {"id": 22, "category": "護岸", "q": "護岸ブロックに段差が生じている。最も疑われる原因はどれか。", "choices": ["裏込材の流出", "樹木繁茂", "塗装劣化", "草刈り不足"], "answer": 1, "explanation": "裏込材の吸い出しにより支持が失われ、段差や沈下が生じます。"}, {"id": 23, "category": "堤防", "q": "堤防天端に幅1mm程度の乾燥ひび割れがある。最も適切な対応はどれか。", "choices": ["直ちに全面復旧する", "経過観察し幅や延長の変化を確認する", "堤防を閉鎖する", "洪水と判断する"], "answer": 2, "explanation": "軽微な乾燥ひび割れは記録し、進行性を確認します。"}, {"id": 24, "category": "点検", "q": "河川巡視の目的として最も適切なのはどれか。", "choices": ["河川利用者の人数を数えること", "河川管理施設の異常を早期に発見すること", "魚類調査を行うこと", "河川清掃だけを行うこと"], "answer": 2, "explanation": "異常の早期発見と適切な対応につなげることが主目的です。"}, {"id": 25, "category": "洗掘", "q": "洗掘が進行すると最も懸念されることはどれか。", "choices": ["基礎の安定性が低下する", "草が増える", "水温が上がる", "河川幅が広がる"], "answer": 1, "explanation": "基礎周辺地盤が失われることで安定性が低下します。"}, {"id": 26, "category": "樋門・樋管", "q": "樋門・樋管の点検で重要でないものはどれか。", "choices": ["開閉装置", "止水ゴム", "漏水の有無", "ペンキの色"], "answer": 4, "explanation": "色そのものより、腐食・剥離・作動・止水機能を確認します。"}, {"id": 27, "category": "安全", "q": "河川点検時の安全管理として適切なのはどれか。", "choices": ["単独で増水河川へ近づく", "ライフジャケットを着用する", "長靴だけ履けば十分である", "夜間は照明なしで巡視する"], "answer": 2, "explanation": "水際や増水時には救命胴衣等の安全装備が必要です。"}, {"id": 28, "category": "堤防", "q": "動物の巣穴を発見した場合、まず行うべきことはどれか。", "choices": ["巣穴の位置・大きさを記録し報告する", "土で埋めて終わる", "放置する", "樹木を伐採する"], "answer": 1, "explanation": "位置・規模・周辺変状を記録し、管理者へ報告します。"}, {"id": 29, "category": "点検", "q": "河川管理施設に異常を発見した場合、最初に行うべきことはどれか。", "choices": ["自分だけで補修する", "記録・報告を行う", "SNSへ投稿する", "写真を削除する"], "answer": 2, "explanation": "状況を安全に記録し、速やかに所定の連絡系統で報告します。"}, {"id": 30, "category": "点検", "q": "堤防点検で最も重要な考え方はどれか。", "choices": ["異常を早期発見し重大災害を未然に防ぐ", "景観を良くする", "草刈りを減らす", "点検時間を短くする"], "answer": 1, "explanation": "点検の本質は異常の早期発見と災害予防です。"}];
let quiz=[], index=0, score=0, remaining=5400, timerId=null, answered=false;
const $=id=>document.getElementById(id);

function loadWrong(){ return JSON.parse(localStorage.getItem('wrongIds')||'[]'); }
function saveWrong(ids){ localStorage.setItem('wrongIds', JSON.stringify([...new Set(ids)])); }
function shuffle(a){ return [...a].sort(()=>Math.random()-.5); }

function updateStats(){
 const wrong=loadWrong().length;
 $('stats').textContent=`収録 ${QUESTIONS.length}問／復習対象 ${wrong}問`;
}
function startQuiz(mode){
 if(mode==='wrong'){
   const ids=loadWrong();
   quiz=QUESTIONS.filter(q=>ids.includes(q.id));
   if(!quiz.length){ alert('復習対象の問題はありません。'); return; }
 } else if(mode==='random10') quiz=shuffle(QUESTIONS).slice(0,10);
 else quiz=shuffle(QUESTIONS);
 index=0; score=0; remaining=5400; answered=false;
 $('home').classList.add('hidden'); $('result').classList.add('hidden'); $('quiz').classList.remove('hidden');
 clearInterval(timerId); timerId=setInterval(tick,1000); tick(); render();
}
function tick(){
 const m=Math.floor(remaining/60), s=remaining%60;
 $('timer').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
 if(remaining<=0){ clearInterval(timerId); finish(); } else remaining--;
}
function render(){
 answered=false; $('feedback').classList.add('hidden'); $('nextBtn').classList.add('hidden');
 const q=quiz[index];
 $('progress').textContent=`${index+1} / ${quiz.length}`;
 $('category').textContent=q.category;
 $('question').textContent=q.q;
 const c=$('choices'); c.innerHTML='';
 q.choices.forEach((t,i)=>{
   const b=document.createElement('button'); b.className='choice'; b.textContent=`${i+1}. ${t}`;
   b.onclick=()=>answer(i+1,b); c.appendChild(b);
 });
}
function answer(n,btn){
 if(answered) return; answered=true;
 const q=quiz[index], buttons=[...document.querySelectorAll('.choice')];
 buttons.forEach((b,i)=>{ if(i+1===q.answer)b.classList.add('correct'); });
 let wrong=loadWrong();
 if(n===q.answer){ score++; wrong=wrong.filter(id=>id!==q.id); }
 else { btn.classList.add('wrong'); wrong.push(q.id); }
 saveWrong(wrong);
 $('feedback').innerHTML=`<strong>${n===q.answer?'正解':'不正解'}（正解：${q.answer}）</strong><br>${q.explanation}`;
 $('feedback').classList.remove('hidden'); $('nextBtn').classList.remove('hidden');
}
function nextQuestion(){ if(index<quiz.length-1){ index++; render(); } else finish(); }
function finish(){
 clearInterval(timerId); $('quiz').classList.add('hidden'); $('result').classList.remove('hidden');
 const pct=Math.round(score/quiz.length*100), cls=pct>=60?'pass':'fail';
 $('score').innerHTML=`<span class="${cls}">${score} / ${quiz.length}問（${pct}%）</span><br><small>${pct>=60?'合格目安':'復習が必要です'}</small>`;
 updateStats();
}
function quitQuiz(){ clearInterval(timerId); showHome(); }
function showHome(){ $('quiz').classList.add('hidden'); $('result').classList.add('hidden'); $('home').classList.remove('hidden'); $('timer').textContent='90:00'; updateStats(); }
function resetProgress(){ if(confirm('学習履歴をリセットしますか？')){ localStorage.removeItem('wrongIds'); updateStats(); } }
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
updateStats();
initGate();
