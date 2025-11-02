
async function fetchJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('Failed to load '+path);
  return await res.json();
}
function qs(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}
function lessonLink(id){
  return `lesson.html?id=${encodeURIComponent(id)}`;
}
async function renderHome(){
  const data = await fetch('data/lessons.json').then(r=>r.json());
  const levels = data.levels;
  const skills = data.skills;
  const lessons = data.lessons;

  const lessonsByLevelSkill = {};
  lessons.forEach(l => {
    const key = l.level + '|' + l.skill;
    (lessonsByLevelSkill[key] = lessonsByLevelSkill[key] || []).push(l);
  });

  const lessonsSection = document.getElementById('lessons-grid');
  lessonsSection.innerHTML = levels.map(level => `
    <div class="card">
      <span class="level-pill">${level}</span>
      ${skills.map(skill => {
        const list = lessonsByLevelSkill[level+'|'+skill] || [];
        const items = list.slice(0,3).map(l => `<li><a href="${lessonLink(l.id)}">${l.title}</a></li>`).join('');
        return `
        <h3 class="section-title">${skill}</h3>
        <ul class="list">${items || '<li class="small">Examples coming soon</li>'}</ul>`;
      }).join('')}
    </div>
  `).join('');
}
async function renderLesson(){
  const id = qs('id');
  const data = await fetch('data/lessons.json').then(r=>r.json());
  const lesson = data.lessons.find(l => l.id === id) || data.lessons[0];
  document.getElementById('lesson-title').textContent = lesson.title;
  document.getElementById('lesson-meta').textContent = `${lesson.level} · ${lesson.skill}`;

  const expl = document.getElementById('explanation');
  expl.innerHTML = lesson.explanation.map(p => `<p>${p}</p>`).join('') + 
    (lesson.examples?.length ? `<div class="card"><strong>Examples</strong><ul class="list">${lesson.examples.map(e=>`<li>${e}</li>`).join('')}</ul></div>` : '');

  const qc = document.getElementById('quiz');
  renderQuiz(qc, lesson.quiz || []);
  const scoreBox = document.getElementById('score');
  document.getElementById('submit-quiz').addEventListener('click', () => {
    const s = scoreQuiz(qc);
    scoreBox.textContent = `Score: ${s.correct} / ${s.total}`;
  });
}
