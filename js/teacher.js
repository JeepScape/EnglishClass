
async function fetchJSON(path){ const r = await fetch(path); if(!r.ok) throw new Error('Load error'); return await r.json(); }
function saveLocal(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }
function loadLocal(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; } catch(e){ return def; } }
function b64Decode(str){ return JSON.parse(decodeURIComponent(escape(atob(str)))) }

const ASSIGN_KEY = 'tec_assignments_v1';
const RESULTS_KEY = 'tec_results_v1';

let codes = [];
let assignments = loadLocal(ASSIGN_KEY, {});
let results = loadLocal(RESULTS_KEY, {});

(async function init(){
  try{
    const data = await fetchJSON('data/codes.json');
    codes = data.codes || [];
  }catch(e){
    codes = [];
  }
  renderTable();
})();

function renderTable(){
  const tbody = document.getElementById('codes-tbody');
  tbody.innerHTML = '';
  codes.forEach(code => {
    const assigned = assignments[code] || '';
    const res = results[code] || null;
    const status = res ? `Complete (${res.score}/${res.total})` : 'Incomplete';
    const ts = res ? new Date(res.ts).toLocaleString() : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${code}</code></td>
      <td><input type="text" value="${assigned}" data-code="${code}" class="assign-input" placeholder="Student name"></td>
      <td>${status}</td>
      <td>${ts}</td>
    `;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.assign-input').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const c = e.target.dataset.code;
      assignments[c] = e.target.value.trim();
      saveLocal(ASSIGN_KEY, assignments);
    });
  });
}

document.getElementById('apply-token').addEventListener('click', () => {
  const token = document.getElementById('token-input').value.trim();
  if(!token){ alert('Paste a result token first.'); return; }
  try{
    const obj = b64Decode(token);
    if(!codes.includes(obj.code)) { alert('Token code not in your list.'); return; }
    results[obj.code] = obj;
    saveLocal(RESULTS_KEY, results);
    renderTable();
    alert('Result recorded.');
  }catch(e){
    alert('Invalid token. Make sure you pasted it correctly.');
  }
});

document.getElementById('export-csv').addEventListener('click', () => {
  const header = ['Code','Assigned To','Status','Score','Total','Timestamp'];
  const rows = codes.map(c => {
    const name = assignments[c] || '';
    const r = results[c] || null;
    const status = r ? 'Complete' : 'Incomplete';
    const score = r ? r.score : '';
    const total = r ? r.total : '';
    const ts = r ? r.ts : '';
    return [c, name, status, score, total, ts];
  });
  const all = [header, ...rows];
  const csv = all.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'homework-results.csv';
  document.body.appendChild(a); a.click(); a.remove();
});

document.getElementById('reset-local').addEventListener('click', () => {
  if(confirm('This will clear local assignments and results on this device. Continue?')){
    localStorage.removeItem(ASSIGN_KEY);
    localStorage.removeItem(RESULTS_KEY);
    assignments = {};
    results = {};
    renderTable();
  }
});
