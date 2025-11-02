
async function fetchJSON(path){ const r = await fetch(path); if(!r.ok) throw new Error('Load error'); return await r.json(); }
function b64Encode(obj){ return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))) }
let validCodes = new Set();
let activeCode = null;

(async function init(){
  try{
    const data = await fetchJSON('data/codes.json');
    (data.codes||[]).forEach(c => validCodes.add(c));
    document.getElementById('codes-count').textContent = (data.codes||[]).length;
  }catch(e){ document.getElementById('codes-count').textContent = '0'; }
})();

document.getElementById('enter-code').addEventListener('click', () => {
  const code = document.getElementById('code-input').value.trim().toUpperCase();
  const status = document.getElementById('code-status');
  if(!validCodes.has(code)){
    status.textContent = 'Invalid code. Please check with your teacher.';
    status.style.color = '#c53030';
    return;
  }
  activeCode = code;
  status.textContent = 'Code accepted. Your homework is ready.';
  status.style.color = '#2f855a';
  document.getElementById('hw-quiz-wrap').style.display = 'block';
});

const hwQuiz = [
  { prompt: 'Choose the correct sentence:', options:['He go to school.','He goes to school.','He going to school.'], answer_index: 1 },
  { prompt: 'Complete: I ____ dinner now.', options:['eat','am eating','eats'], answer_index: 1 }
];
const quizC = document.getElementById('hw-quiz');
renderQuiz(quizC, hwQuiz);

document.getElementById('submit-hw').addEventListener('click', () => {
  if(!activeCode){ alert('Enter your code first.'); return; }
  const s = scoreQuiz(quizC);
  const payload = { code: activeCode, score: s.correct, total: s.total, ts: new Date().toISOString() };
  const token = b64Encode(payload);
  document.getElementById('result-token').value = token;
  document.getElementById('token-wrap').style.display = 'block';
});

document.getElementById('copy-token').addEventListener('click', async () => {
  const t = document.getElementById('result-token').value;
  try { await navigator.clipboard.writeText(t); alert('Token copied. Send this code to your teacher.'); }
  catch(e){ alert('Copy failed. Select and copy manually.'); }
});
