
async function fetchJSONPreferScraped(){
  async function tryFetch(path){
    const r = await fetch(path);
    if(!r.ok) throw new Error('not ok');
    return r.json();
  }
  try{ return await tryFetch('data/lessons.scraped.json'); }
  catch{ return await tryFetch('data/lessons.json'); }
}
function qs(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}
function lessonLink(id){
  return `lesson.html?id=${encodeURIComponent(id)}`;
}
function lessonCard(l){
  return `<li><a href="${lessonLink(l.id)}">${l.title}</a></li>`;
}
async function renderHome(){
  const data = await fetchJSONPreferScraped();
  const levels = data.levels;
  const skills = data.skills;
  const lessons = data.lessons;

  const levelSel = document.getElementById('level-filter');
  const skillSel = document.getElementById('skill-filter');
  const qInput = document.getElementById('q');
  levels.forEach(L => levelSel.append(new Option(L, L)));
  skills.forEach(S => skillSel.append(new Option(S, S)));

  function apply(){
    const L = levelSel.value;
    const S = skillSel.value;
    const Q = (qInput.value || '').toLowerCase();
    const filtered = lessons.filter(x =>
      (!L || x.level === L) &&
      (!S || x.skill === S) &&
      (!Q || (x.title.toLowerCase().includes(Q) || x.skill.toLowerCase().includes(Q)))
    );
    const groups = {};
    filtered.forEach(l => {
      const key = l.level+'|'+l.skill;
      (groups[key] = groups[key] || []).push(l);
    });
    const grid = document.getElementById('lessons-grid');
    grid.innerHTML = Object.keys(groups).sort().map(k => {
      const [L2,S2] = k.split('|');
      const items = groups[k].slice(0,12).map(lessonCard).join('');
      return `<div class="card"><span class="level-pill">${L2}</span>
        <h3 class="section-title">${S2}</h3>
        <ul class="list">${items}</ul></div>`;
    }).join('') || '<p class="small">No lessons match the filters.</p>';
  }

  levelSel.addEventListener('change', apply);
  skillSel.addEventListener('change', apply);
  qInput.addEventListener('input', apply);
  apply();
}

async function renderLesson(){
  const id = qs('id');
  const data = await fetchJSONPreferScraped();
  const lesson = data.lessons.find(l => l.id === id) || data.lessons[0];
  document.getElementById('lesson-title').textContent = lesson.title;
  document.getElementById('lesson-meta').textContent = `${lesson.level} · ${lesson.skill}`;

  const content = document.getElementById('content');
  const srcLink = lesson.source_url ? `<p class="small">Source: <a href="${lesson.source_url}" target="_blank" rel="noopener">test-english.com</a></p>` : '';
  const body = lesson.content_html || (lesson.explanation ? lesson.explanation.map(p=>`<p>${p}</p>`).join('') : '');
  content.innerHTML = body + srcLink;

  const mediaWrap = document.getElementById('media');
  const yt = (lesson.media && lesson.media.youtube) ? lesson.media.youtube : [];
  if(yt.length){
    mediaWrap.innerHTML = yt.map(id => `<div class="card" style="margin-bottom:1rem;"><iframe allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen src="https://www.youtube.com/embed/${id}"></iframe></div>`).join('');
  }

  const qc = document.getElementById('quiz');
  renderQuiz(qc, lesson.questions || lesson.quiz || []);
  document.getElementById('submit-quiz').addEventListener('click', () => {
    const s = scoreQuiz(qc);
    document.getElementById('score').textContent = `Score: ${s.correct} / ${s.total}`;
  });
}
