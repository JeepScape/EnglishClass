const quizData = [
  { question: 'He ____ to work every day.', options: ['go', 'goes', 'is going'], answer: 1 },
  { question: 'They ____ dinner at the moment.', options: ['eat', 'are eating', 'eats'], answer: 1 }
];

const quizContainer = document.getElementById('quiz');

function loadQuiz() {
  quizContainer.innerHTML = quizData.map((q, i) => `
    <div class='question'>
      <p><strong>${i + 1}.</strong> ${q.question}</p>
      <div class='options'>
        ${q.options.map((opt, idx) =>
          `<button onclick='checkAnswer(this, ${idx === q.answer})'>${opt}</button>`
        ).join('')}
      </div>
    </div>
  `).join('');
}
function checkAnswer(button, correct) {
  const parent = button.parentElement;
  [...parent.children].forEach(b => b.disabled = true);
  button.classList.add(correct ? 'correct' : 'incorrect');
}
function resetQuiz() {
  loadQuiz();
}
loadQuiz();