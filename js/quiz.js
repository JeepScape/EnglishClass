
function renderQuiz(container, quiz) {
  if(!quiz || !quiz.length){ container.innerHTML = '<p class="small">No quiz for this lesson.</p>'; return; }
  container.innerHTML = quiz.map((q, i) => `
    <div class="question card" style="margin-bottom:1rem;">
      <p><strong>${i+1}.</strong> ${q.prompt || q.question}</p>
      <div class="options">
        ${(q.options||[]).map((opt, idx) =>
          `<button data-correct="${idx === (q.answer_index ?? q.answer)}">${opt}</button>`
        ).join('')}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.options').forEach(optGroup => {
    optGroup.addEventListener('click', (e) => {
      if(e.target.tagName.toLowerCase() !== 'button') return;
      const buttons = [...optGroup.querySelectorAll('button')];
      buttons.forEach(b => b.disabled = true);
      if (e.target.dataset.correct === 'true') {
        e.target.classList.add('correct');
      } else {
        e.target.classList.add('incorrect');
      }
      container.dispatchEvent(new CustomEvent('quiz-answered', {detail:{correct: e.target.dataset.correct === 'true'}}));
    });
  });
}
function scoreQuiz(container){
  const chosen = container.querySelectorAll('.options button[disabled]');
  let correct = 0;
  chosen.forEach(b => { if (b.classList.contains('correct')) correct++; });
  return { correct, total: container.querySelectorAll('.question').length };
}
