let quizData = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let quizType = '';

const quizTitleMap = {
    'basico': 'Ensino Básico',
    'secundario': 'Ensino Secundário',
    'comuns': 'Disposições Comuns'
};

// DOM Elements
const loadingEl = document.getElementById('loading');
const quizEl = document.getElementById('quiz-content');
const resultsEl = document.getElementById('results');
const questionTextEl = document.getElementById('question-text');
const sectionTitleEl = document.getElementById('section-title');
const optionsContainerEl = document.getElementById('options-container');
const progressFillEl = document.getElementById('progress-fill');
const currentScoreEl = document.getElementById('current-score');
const finalScoreEl = document.getElementById('final-score');
const feedbackContainerEl = document.getElementById('feedback-container');

// Buttons
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnAnswer = document.getElementById('btn-answer');
const btnRestart = document.getElementById('btn-restart');
const btnContinue = document.getElementById('btn-continue');

async function initQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    quizType = urlParams.get('type') || 'basico';
    
    document.title = `Quiz - ${quizTitleMap[quizType] || 'Exames'}`;
    document.getElementById('header-title').textContent = quizTitleMap[quizType] || 'Questões de Exames';

    try {
        const response = await fetch(`data/${quizType}.json`);
        if (!response.ok) throw new Error('Falha ao carregar os dados do quiz.');
        quizData = await response.json();
        
        loadState();
        showLoading(false);
        renderQuestion();
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar o quiz. Verifique se está a usar um servidor local.');
    }
}

function showLoading(show) {
    loadingEl.style.display = show ? 'flex' : 'none';
    quizEl.style.display = show ? 'none' : 'block';
}

function renderQuestion() {
    const question = quizData[currentQuestionIndex];
    
    // Reset state
    optionsContainerEl.innerHTML = '';
    feedbackContainerEl.style.display = 'none';
    feedbackContainerEl.className = 'feedback-container';
    
    // Set text
    sectionTitleEl.textContent = question.s || '';
    questionTextEl.textContent = `${currentQuestionIndex + 1}. ${question.q}`;
    
    // Render options
    question.o.forEach((optionText, index) => {
        const optionEl = document.createElement('button');
        optionEl.className = 'option';
        optionEl.textContent = optionText;
        
        if (userAnswers[currentQuestionIndex] === index) {
            optionEl.classList.add('selected');
        }
        
        optionEl.onclick = () => selectOption(index);
        optionsContainerEl.appendChild(optionEl);
    });

    // Update Progress
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    progressFillEl.style.width = `${progress}%`;
    
    // Update Buttons
    btnPrev.disabled = currentQuestionIndex === 0;
    btnNext.textContent = currentQuestionIndex === quizData.length - 1 ? 'Finalizar' : 'Próxima';
    btnAnswer.disabled = userAnswers[currentQuestionIndex] === undefined;
}

function selectOption(index) {
    userAnswers[currentQuestionIndex] = index;
    
    // Update UI
    const options = optionsContainerEl.querySelectorAll('.option');
    options.forEach((opt, idx) => {
        opt.classList.toggle('selected', idx === index);
        opt.classList.remove('correct', 'incorrect');
    });
    
    btnAnswer.disabled = false;
    saveState();
}

function checkAnswer() {
    const question = quizData[currentQuestionIndex];
    const selectedIdx = userAnswers[currentQuestionIndex];
    const correctIdx = question.a;
    
    const options = optionsContainerEl.querySelectorAll('.option');
    
    options.forEach((opt, idx) => {
        opt.classList.remove('selected');
        if (idx === correctIdx) {
            opt.classList.add('correct');
        } else if (idx === selectedIdx) {
            opt.classList.add('incorrect');
        }
    });

    feedbackContainerEl.style.display = 'block';
    if (selectedIdx === correctIdx) {
        feedbackContainerEl.textContent = "Correto! Parabéns.";
        feedbackContainerEl.classList.add('feedback-correct');
    } else {
        feedbackContainerEl.textContent = `Incorreto. A resposta certa é: ${question.o[correctIdx]}`;
        feedbackContainerEl.classList.add('feedback-incorrect');
    }
    
    btnAnswer.disabled = true;
}

function nextQuestion() {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
        saveState();
    } else {
        showResults();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
        saveState();
    }
}

function showResults() {
    score = 0;
    quizData.forEach((q, i) => {
        if (userAnswers[i] === q.a) score++;
    });
    
    quizEl.style.display = 'none';
    resultsEl.style.display = 'block';
    finalScoreEl.textContent = `${score} / ${quizData.length}`;
    
    const percentage = (score / quizData.length) * 100;
    document.getElementById('score-message').textContent = 
        percentage >= 50 ? "Excelente trabalho!" : "Continue a estudar!";
        
    localStorage.removeItem(`quiz_state_${quizType}`);
}

function restartQuiz() {
    if (confirm("Tens a certeza que queres reiniciar o questionário?")) {
        currentQuestionIndex = 0;
        userAnswers = [];
        score = 0;
        localStorage.removeItem(`quiz_state_${quizType}`);
        resultsEl.style.display = 'none';
        quizEl.style.display = 'block';
        renderQuestion();
    }
}

function saveState() {
    const state = {
        index: currentQuestionIndex,
        answers: userAnswers
    };
    localStorage.setItem(`quiz_state_${quizType}`, JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem(`quiz_state_${quizType}`);
    if (saved) {
        const state = JSON.parse(saved);
        currentQuestionIndex = state.index || 0;
        userAnswers = state.answers || [];
    }
}

// Event Listeners
btnPrev.onclick = prevQuestion;
btnNext.onclick = nextQuestion;
btnAnswer.onclick = checkAnswer;
btnRestart.onclick = restartQuiz;
btnContinue.onclick = () => {
    // Already in loadState called by initQuiz, but we could add more logic here
    renderQuestion();
};

// Initialize
initQuiz();
