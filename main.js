// Ứng dụng luyện thi trắc nghiệm
class QuizApp {
    constructor() {
        this.exams = [];
        this.currentExam = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.shuffledQuestions = [];
        this.init();
    }

    async init() {
        await this.loadExams();
        this.renderExamSelection();
        this.setupEventListeners();
    }

    async loadExams() {
        try {
            const response = await fetch('exams.json');
            const data = await response.json();
            this.exams = data.exams;
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
            this.showError('Không thể tải dữ liệu đề thi. Vui lòng thử lại.');
        }
    }

    renderExamSelection() {
        const examList = document.getElementById('examList');
        examList.innerHTML = '';

        this.exams.forEach(exam => {
            const examBtn = document.createElement('button');
            examBtn.className = 'btn exam-btn';
            examBtn.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold">${exam.title}</span>
                    <span class="badge bg-light text-dark">${exam.questions.length} câu</span>
                </div>
            `;
            examBtn.addEventListener('click', () => this.startExam(exam));
            examList.appendChild(examBtn);
        });
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    startExam(exam) {
        this.currentExam = exam;
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(exam.questions.length).fill('');
        
        // Xáo trộn câu hỏi và các tùy chọn
        this.shuffledQuestions = this.shuffleArray(exam.questions).map(question => ({
            ...question,
            shuffledOptions: this.shuffleArray(question.options)
        }));
        
        this.showSection('examArea');
        document.getElementById('examTitle').textContent = exam.title;
        this.renderQuestion();
        this.updateNavigationButtons();
    }

    renderQuestion() {
        const question = this.shuffledQuestions[this.currentQuestionIndex];
        const container = document.getElementById('questionContainer');
        
        container.innerHTML = `
            <div class="question-card fade-in">
                <h5 class="mb-4">Câu ${this.currentQuestionIndex + 1}: ${question.question}</h5>
                <div class="options-container">
                    ${question.shuffledOptions.map((option, index) => `
                        <button class="option-btn ${this.userAnswers[this.currentQuestionIndex] === option ? 'selected' : ''}" 
                                data-option="${option}">
                            ${option}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        this.updateQuestionCounter();
        this.setupOptionListeners();
    }

    setupOptionListeners() {
        const optionBtns = document.querySelectorAll('.option-btn');
        optionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Bỏ chọn tất cả các tùy chọn khác
                optionBtns.forEach(b => b.classList.remove('selected'));
                
                // Chọn tùy chọn hiện tại
                e.target.classList.add('selected');
                
                // Lưu câu trả lời
                this.userAnswers[this.currentQuestionIndex] = e.target.dataset.option;
            });
        });
    }

    updateQuestionCounter() {
        const counter = document.getElementById('questionCounter');
        const answered = this.userAnswers.filter(answer => answer !== '').length;
        counter.innerHTML = `
            <span class="badge bg-light text-dark">
                ${this.currentQuestionIndex + 1}/${this.shuffledQuestions.length} 
                (Đã trả lời: ${answered})
            </span>
        `;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.shuffledQuestions.length - 1) {
            nextBtn.classList.add('d-none');
            submitBtn.classList.remove('d-none');
        } else {
            nextBtn.classList.remove('d-none');
            submitBtn.classList.add('d-none');
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
            this.updateNavigationButtons();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.shuffledQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
            this.updateNavigationButtons();
        }
    }

    submitExam() {
        // Kiểm tra có câu hỏi nào chưa trả lời không
        const unanswered = this.userAnswers.filter(answer => answer === '').length;
        
        if (unanswered > 0) {
            const confirmSubmit = confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài?`);
            if (!confirmSubmit) return;
        }

        this.showResults();
    }

    showResults() {
        const results = this.calculateResults();
        this.showSection('resultArea');
        this.renderResults(results);
    }

    calculateResults() {
        let correctAnswers = 0;
        const details = [];

        this.shuffledQuestions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = userAnswer === question.answer;
            
            if (isCorrect) correctAnswers++;

            details.push({
                question: question.question,
                userAnswer: userAnswer || 'Không trả lời',
                correctAnswer: question.answer,
                isCorrect: isCorrect,
                shuffledOptions: question.shuffledOptions
            });
        });

        const totalQuestions = this.shuffledQuestions.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);

        return {
            correctAnswers,
            totalQuestions,
            percentage,
            details
        };
    }

    renderResults(results) {
        const resultTitle = document.getElementById('resultTitle');
        const scoreDisplay = document.getElementById('scoreDisplay');
        const scoreText = document.getElementById('scoreText');
        const reviewAccordion = document.getElementById('reviewAccordion');

        resultTitle.textContent = `Kết quả: ${this.currentExam.title}`;
        
        // Hiển thị điểm số với màu sắc
        let scoreClass = 'score-poor';
        let scoreEmoji = '😔';
        
        if (results.percentage >= 80) {
            scoreClass = 'score-excellent';
            scoreEmoji = '🎉';
        } else if (results.percentage >= 60) {
            scoreClass = 'score-good';
            scoreEmoji = '😊';
        }

        scoreDisplay.innerHTML = `
            <div class="score-circle ${scoreClass}">
                ${results.percentage}%
            </div>
        `;

        scoreText.innerHTML = `
            ${scoreEmoji} Bạn trả lời đúng <strong>${results.correctAnswers}/${results.totalQuestions}</strong> câu
        `;

        // Hiển thị chi tiết từng câu hỏi
        reviewAccordion.innerHTML = '';
        results.details.forEach((detail, index) => {
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';
            
            const isCorrect = detail.isCorrect;
            const statusIcon = isCorrect ? '✅' : '❌';
            const statusClass = isCorrect ? 'correct' : 'incorrect';
            
            accordionItem.innerHTML = `
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                        ${statusIcon} Câu ${index + 1} - ${isCorrect ? 'Đúng' : 'Sai'}
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse" 
                     data-bs-parent="#reviewAccordion">
                    <div class="accordion-body">
                        <div class="question-review ${statusClass}">
                            <h6 class="fw-bold mb-3">${detail.question}</h6>
                            
                            <div class="mb-2">
                                <strong>Câu trả lời của bạn:</strong>
                                <span class="ms-2 ${isCorrect ? 'text-success' : 'text-danger'}">
                                    ${detail.userAnswer}
                                </span>
                            </div>
                            
                            ${!isCorrect ? `
                                <div class="mb-2">
                                    <strong>Đáp án đúng:</strong>
                                    <span class="ms-2 text-success">${detail.correctAnswer}</span>
                                </div>
                            ` : ''}
                            
                            <div class="mt-3">
                                <strong>Tất cả các tùy chọn:</strong>
                                <ul class="mt-2">
                                    ${question.shuffledOptions.map(option => `
                                        <li class="${option === detail.correctAnswer ? 'text-success fw-bold' : ''}">
                                            ${option}
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            reviewAccordion.appendChild(accordionItem);
        });
    }

    retakeExam() {
        this.startExam(this.currentExam);
    }

    backToSelection() {
        this.showSection('examSelection');
        this.currentExam = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.shuffledQuestions = [];
    }

    showSection(sectionId) {
        const sections = ['examSelection', 'examArea', 'resultArea'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (id === sectionId) {
                element.classList.remove('d-none');
                element.classList.add('fade-in');
            } else {
                element.classList.add('d-none');
                element.classList.remove('fade-in');
            }
        });
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('submitBtn').addEventListener('click', () => this.submitExam());
        
        // Back to selection buttons
        document.getElementById('backToSelection').addEventListener('click', () => this.backToSelection());
        document.getElementById('backToSelectionFromResult').addEventListener('click', () => this.backToSelection());
        
        // Retake exam button
        document.getElementById('retakeBtn').addEventListener('click', () => this.retakeExam());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.currentExam && document.getElementById('examArea').classList.contains('d-none') === false) {
                if (e.key === 'ArrowLeft' && this.currentQuestionIndex > 0) {
                    this.previousQuestion();
                } else if (e.key === 'ArrowRight' && this.currentQuestionIndex < this.shuffledQuestions.length - 1) {
                    this.nextQuestion();
                } else if (e.key === 'Enter' && this.currentQuestionIndex === this.shuffledQuestions.length - 1) {
                    this.submitExam();
                }
            }
        });
    }

    showError(message) {
        const examList = document.getElementById('examList');
        examList.innerHTML = `
            <div class="alert alert-danger text-center">
                <h5>❌ Lỗi</h5>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Thử lại</button>
            </div>
        `;
    }
}

// Khởi tạo ứng dụng khi trang web được tải
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});