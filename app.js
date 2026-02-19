import { questions } from './questions.js';
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const app = firebaseConfig.apiKey !== "YOUR_API_KEY" ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const provider = new GoogleAuthProvider();

const IS_DUMMY_MODE = !app;

class LoveLanguageApp {
  constructor() {
    this.currentStep = 0;
    this.scores = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    this.answers = [];
    this.user = null;

    // DOM Elements
    this.views = {
      landing: document.getElementById('landing-page'),
      quiz: document.getElementById('quiz-page'),
      results: document.getElementById('results-page')
    };
    this.loginBtn = document.getElementById('login-btn');
    this.optionA = document.getElementById('option-a');
    this.optionB = document.getElementById('option-b');
    this.progressBar = document.getElementById('progress-bar');
    this.stepCounter = document.getElementById('step-counter');

    this.init();
    this.checkAuthState();
  }

  init() {
    this.loginBtn.addEventListener('click', () => this.handleLogin());
    this.optionA.addEventListener('click', () => this.handleAnswer('A'));
    this.optionB.addEventListener('click', () => this.handleAnswer('B'));

    document.getElementById('compare-btn').addEventListener('click', () => this.handleCompare());
  }

  checkAuthState() {
    if (IS_DUMMY_MODE) {
      console.warn("⚠️ Dummy Mode: Firebase is not configured. Using fake login.");
      return;
    }
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.user = user;
        this.loginBtn.textContent = "테스트 시작하기";
        console.log("Logged in as:", user.displayName);
      } else {
        this.user = null;
        this.loginBtn.textContent = "구글로 시작하기";
      }
    });
  }

  async handleLogin() {
    if (this.user) {
      this.startQuiz();
      return;
    }

    if (IS_DUMMY_MODE) {
      this.user = {
        uid: "dummy-user-123",
        displayName: "테스트 사용자"
      };
      this.loginBtn.textContent = "테스트 시작하기 (더미)";
      this.startQuiz();
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      this.user = result.user;
      this.startQuiz();
    } catch (error) {
      console.error("Login Error:", error);
      alert("로그인에 실패했습니다. 다시 시도해주세요.");
    }
  }

  showView(viewName) {
    Object.values(this.views).forEach(view => view.classList.remove('active'));
    this.views[viewName].classList.add('active');
  }

  startQuiz() {
    // Initial setup for quiz
    this.currentStep = 0;
    this.scores = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    this.answers = [];
    this.showView('quiz');
    this.updateQuestion();
  }

  updateQuestion() {
    if (this.currentStep >= questions.length) {
      this.showResults();
      return;
    }

    const q = questions[this.currentStep];
    this.optionA.textContent = q.options[0].text;
    this.optionA.dataset.type = q.options[0].type;
    this.optionB.textContent = q.options[1].text;
    this.optionB.dataset.type = q.options[1].type;

    // Update progress
    const progress = ((this.currentStep + 1) / questions.length) * 100;
    this.progressBar.style.width = `${progress}%`;
    this.stepCounter.textContent = `${this.currentStep + 1} / ${questions.length}`;
  }

  handleAnswer(optionIndex) {
    const selectedOption = questions[this.currentStep].options[optionIndex === 'A' ? 0 : 1];
    this.scores[selectedOption.type]++;
    this.answers.push(selectedOption.type);

    this.currentStep++;

    // Add a small delay for smooth transition
    setTimeout(() => {
      this.updateQuestion();
    }, 200);
  }

  async showResults() {
    this.showView('results');
    this.renderChart();
    this.renderDescription();

    if (this.user) {
      await this.saveResults();
    }
  }

  async saveResults() {
    if (IS_DUMMY_MODE) {
      console.log("📝 Dummy Mode: Results would be saved here:", {
        scores: this.scores,
        answers: this.answers
      });
      return;
    }
    try {
      await setDoc(doc(db, "results", this.user.uid), {
        displayName: this.user.displayName,
        scores: this.scores,
        answers: this.answers,
        timestamp: new Date()
      });
      console.log("Results saved!");
    } catch (error) {
      console.error("Error saving results:", error);
    }
  }

  async handleCompare() {
    if (IS_DUMMY_MODE) {
      const dummyPartner = {
        displayName: "더미 파트너",
        scores: { A: 10, B: 5, C: 2, D: 8, E: 3 }
      };
      alert("Dummy Mode: 'partner-id' 입력 대신 미리 설정된 더미 데이터를 보여줍니다.");
      this.renderComparison(dummyPartner);
      return;
    }
    const partnerId = prompt("상대방의 고유 ID(UID)를 입력하세요:");
    if (!partnerId) return;

    try {
      const docRef = doc(db, "results", partnerId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const partnerData = docSnap.data();
        this.renderComparison(partnerData);
      } else {
        alert("해당 ID의 결과를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("Comparison Error:", error);
    }
  }

  renderComparison(partnerData) {
    const container = document.getElementById('results-description');
    const labels = {
      A: '인정하는 말 💬', B: '함께하는 시간 ⏳', C: '선물 🎁', D: '봉사 🤝', E: '스킨십 🫂'
    };

    const myPrimary = Object.entries(this.scores).sort((a, b) => b[1] - a[1])[0][0];
    const partnerPrimary = Object.entries(partnerData.scores).sort((a, b) => b[1] - a[1])[0][0];

    const comparisonDiv = document.createElement('div');
    comparisonDiv.style.cssText = 'margin-top: 30px; padding: 20px; background: rgba(255,117,140,0.1); border-radius: 15px; text-align: left;';
    comparisonDiv.innerHTML = `
      <h3 style="margin-bottom: 15px;">💕 커플 비교 결과</h3>
      <p>나의 주 언어: <strong>${labels[myPrimary]}</strong></p>
      <p>${partnerData.displayName}님의 주 언어: <strong>${labels[partnerPrimary]}</strong></p>
      <p style="margin-top: 10px; font-size: 0.9rem; color: var(--text-light);">
          ${myPrimary === partnerPrimary ? "두 분은 같은 언어를 사용하고 계시네요! 서로를 더 잘 이해할 수 있을 거예요." : "두 분은 서로 다른 언어를 통해 사랑을 느끼고 계시군요. 서로의 언어로 표현해주려 노력해보세요."}
      </p>
      <div style="margin-top: 15px; font-size: 0.7rem; color: #888;">나의 UID: ${this.user.uid}</div>
    `;
    container.appendChild(comparisonDiv);
  }

  renderChart() {
    const resultsContainer = document.getElementById('results-chart');
    resultsContainer.innerHTML = '';

    const labels = {
      A: '인정하는 말 💬',
      B: '함께하는 시간 ⏳',
      C: '선물 🎁',
      D: '봉사 🤝',
      E: '스킨십 🫂'
    };

    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 30px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      overflow: hidden;
    `;

    const headerRow = document.createElement('tr');
    headerRow.style.background = 'rgba(255, 117, 140, 0.2)';
    headerRow.innerHTML = `
      <th style="padding: 15px; border-bottom: 1px solid var(--glass-border); text-align: left; font-size: 1rem;">사랑의 언어 항목</th>
      <th style="padding: 15px; border-bottom: 1px solid var(--glass-border); font-size: 1rem;">점수</th>
    `;
    table.appendChild(headerRow);

    Object.entries(this.scores).forEach(([type, score]) => {
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid var(--glass-border)';
      row.innerHTML = `
        <td style="padding: 15px; text-align: left; font-weight: 600; font-size: 1rem;">${labels[type]}</td>
        <td style="padding: 15px; font-size: 1.2rem; font-weight: 800; color: var(--primary-color);">${score}</td>
      `;
      table.appendChild(row);
    });

    resultsContainer.appendChild(table);
  }

  renderDescription() {
    const container = document.getElementById('results-description');
    const sortedScores = Object.entries(this.scores).sort((a, b) => b[1] - a[1]);
    const primaryLanguage = sortedScores[0][0];

    const descriptions = {
      A: "당신은 사랑하는 사람으로부터 따뜻한 말 한마디와 격려를 받을 때 가장 큰 사랑을 느낍니다.",
      B: "당신은 상대방이 오롯이 당신에게만 집중하며 함께 시간을 보내줄 때 진정한 연결을 느낍니다.",
      C: "당신은 선물을 받을 때, 그 물건 자체보다 당신을 생각하며 준비한 상대방의 마음에서 사랑을 확인합니다.",
      D: "당신은 상대방이 당신을 위해 구체적인 행동으로 도움을 줄 때 깊은 배려와 사랑을 느낍니다.",
      E: "당신은 가벼운 손잡기나 포옹 같은 신체적 접촉을 통해 정서적인 안정과 사랑을 확인합니다."
    };

    const labels = {
      A: '인정하는 말',
      B: '함께하는 시간',
      C: '선물',
      D: '봉사',
      E: '스킨십'
    };

    container.innerHTML = `
            <div style="margin-top: 20px; text-align: left;">
                <h3 style="margin-bottom: 10px; color: var(--primary-color);">나의 주 언어: ${labels[primaryLanguage]}</h3>
                <p style="font-size: 1rem; line-height: 1.6; color: var(--text-color);">${descriptions[primaryLanguage]}</p>
            </div>
        `;
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  new LoveLanguageApp();
});
