import { questions } from './questions.js';
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const app = firebaseConfig.apiKey !== "YOUR_API_KEY" ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const provider = new GoogleAuthProvider();

const IS_DUMMY_MODE = false;

class LoveLanguageApp {
  constructor() {
    this.currentStep = 0;
    this.scores = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    this.answers = [];
    this.user = null;
    this.labels = { A: '인정하는 말 💬', B: '함께하는 시간 ⏳', C: '선물 🎁', D: '봉사 🤝', E: '스킨십 🫂' };

    // DOM Elements
    this.views = {
      landing: document.getElementById('landing-page'),
      quiz: document.getElementById('quiz-page'),
      results: document.getElementById('results-page'),
      comparison: document.getElementById('comparison-page')
    };
    this.loginBtn = document.getElementById('login-btn');
    this.optionA = document.getElementById('option-a');
    this.optionB = document.getElementById('option-b');
    this.progressBar = document.getElementById('progress-bar');
    this.stepCounter = document.getElementById('step-counter');
    this.viewResultsBtn = document.getElementById('view-results-btn');
    this.welcomeMsg = document.getElementById('welcome-message');
    this.logoutBtn = document.getElementById('logout-btn');
    this.footerText = document.getElementById('footer-text');

    this.previousResults = null;

    this.init();
    this.checkAuthState();
  }

  init() {
    this.loginBtn.addEventListener('click', () => this.handleLogin());
    this.logoutBtn.addEventListener('click', () => this.handleLogout());
    this.optionA.addEventListener('click', () => this.handleAnswer('A'));
    this.optionB.addEventListener('click', () => this.handleAnswer('B'));

    document.getElementById('compare-btn').addEventListener('click', () => this.handleCompare());
    document.getElementById('share-btn').addEventListener('click', () => this.handleShare());
    document.getElementById('back-to-results').addEventListener('click', () => this.showView('results'));
    document.getElementById('go-home-btn').addEventListener('click', () => this.showView('landing'));
    this.viewResultsBtn.addEventListener('click', () => this.showResults(true));
  }

  async handleLogout() {
    try {
      await signOut(auth);
      location.reload();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  }

  handleShare() {
    if (!this.user) {
      this.showModal({ title: '알림', message: '로그인이 필요합니다.' });
      return;
    }
    navigator.clipboard.writeText(this.user.uid).then(() => {
      this.showModal({ title: '복사 완료', message: '나의 고유 ID(UID)가 클립보드에 복사되었습니다! 연인에게 전달해주세요.' });
    }).catch(err => {
      console.error('복사 실패:', err);
      this.showModal({ title: '오류', message: '복사에 실패했습니다. 직접 복사해 주세요.' });
    });
  }

  renderDescription() {
    const container = document.getElementById('results-description');
    const sortedScores = Object.entries(this.scores).sort((a, b) => b[1] - a[1]);
    const primaryLanguage = sortedScores[0][0];

    container.innerHTML = `
      <div style="margin-top: 25px; text-align: left; animation: fadeIn 0.6s ease-out;">
          <h3 style="margin-bottom: 20px; color: var(--primary-color); font-size: 1.3rem; font-weight: 800;">나의 주 언어: ${this.labels[primaryLanguage]}</h3>
          
          <div class="uid-container">
            <div style="display: flex; flex-direction: column;">
              <span class="uid-label">나의 고유 ID</span>
              <span class="uid-value">${this.user ? this.user.uid : '로그인 필요'}</span>
            </div>
            <button onclick="window.app.handleShare()" style="background: var(--primary-color); color: white; border: none; padding: 8px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">복사</button>
          </div>
          
          <div id="detail-area-results"></div>
      </div>
    `;
    // Expose app instance for inline onclick
    window.app = this;
  }

  checkAuthState() {
    if (IS_DUMMY_MODE) {
      console.warn("⚠️ Dummy Mode: Firebase is not configured. Using fake login.");
      return;
    }
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.user = user;
        this.loginBtn.textContent = "테스트 시작하기";
        this.logoutBtn.style.display = 'block';
        this.footerText.style.display = 'none';
        await this.fetchUserResults();
      } else {
        this.user = null;
        this.loginBtn.textContent = "구글로 시작하기";
        this.viewResultsBtn.style.display = 'none';
        this.logoutBtn.style.display = 'none';
        this.footerText.style.display = 'block';
        this.welcomeMsg.textContent = "서로의 마음을 더 깊이 이해하는 시간";
      }
    });
  }

  async fetchUserResults() {
    try {
      const docRef = doc(db, "results", this.user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.previousResults = docSnap.data();
        this.updateLandingUI();
      }
    } catch (error) {
      console.error("Error fetching user results:", error);
    }
  }

  updateLandingUI() {
    if (this.previousResults && this.user) {
      this.loginBtn.textContent = "다시 테스트하기";
      this.viewResultsBtn.style.display = 'block';
      this.welcomeMsg.innerHTML = `${this.user.displayName}님, 다시 오셨군요! 🌸<br>이전 결과를 확인하시거나 새로 테스트를 하실 수 있습니다.`;
    }
  }

  async handleLogin() {
    if (this.user) {
      if (this.previousResults) {
        this.showModal({
          title: '다시 테스트하시겠습니까?',
          message: '새로운 테스트 결과로 기존 데이터가 대체됩니다. 계속하시겠습니까?',
          type: 'confirm',
          onConfirm: (val) => { if (val) this.startQuiz(); }
        });
        return;
      }
      this.startQuiz();
      return;
    }

    if (IS_DUMMY_MODE) {
      this.user = { uid: "dummy-user-123", displayName: "테스트 사용자" };
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
    window.scrollTo(0, 0);
  }

  startQuiz() {
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
    this.optionB.textContent = q.options[1].text;

    const progress = ((this.currentStep + 1) / questions.length) * 100;
    this.progressBar.style.width = `${progress}%`;
    this.stepCounter.textContent = `${this.currentStep + 1} / ${questions.length}`;
  }

  handleAnswer(optionKey) {
    const q = questions[this.currentStep];
    const type = optionKey === 'A' ? q.options[0].type : q.options[1].type;
    this.scores[type]++;
    this.answers.push(type);
    this.currentStep++;
    setTimeout(() => {
      this.updateQuestion();
    }, 150);
  }

  async showResults(loadPrevious = false) {
    if (loadPrevious && this.previousResults) {
      this.scores = this.previousResults.scores;
      this.answers = this.previousResults.answers;
    }
    this.showView('results');
    this.renderChart();
    this.renderDescription();

    if (this.user && !IS_DUMMY_MODE && !loadPrevious) {
      await this.saveResults();
    }
  }

  async saveResults() {
    try {
      const data = {
        displayName: this.user.displayName,
        scores: this.scores,
        answers: this.answers,
        timestamp: new Date()
      };
      await setDoc(doc(db, "results", this.user.uid), data);
      this.previousResults = data;
      this.updateLandingUI();
    } catch (error) {
      console.error("Error saving results:", error);
    }
  }

  showModal({ title, message, type = 'alert', onConfirm = null }) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const inputContainer = document.getElementById('modal-input-container');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    titleEl.textContent = title;
    bodyEl.textContent = message;
    inputContainer.innerHTML = '';

    if (type === 'prompt') {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'modal-input';
      input.placeholder = 'UID를 입력하세요';
      inputContainer.appendChild(input);
      setTimeout(() => input.focus(), 100);
    }

    cancelBtn.style.display = (type === 'prompt' || type === 'confirm') ? 'block' : 'none';
    overlay.classList.add('active');

    confirmBtn.onclick = () => {
      const val = type === 'prompt' ? inputContainer.querySelector('input').value : true;
      overlay.classList.remove('active');
      if (onConfirm) onConfirm(val);
    };

    cancelBtn.onclick = () => overlay.classList.remove('active');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('active'); };
  }

  async handleCompare() {
    if (IS_DUMMY_MODE) {
      const dummyPartner = {
        displayName: "더미 파트너",
        scores: { A: 8, B: 10, C: 2, D: 4, E: 6 },
        answers: ["A", "B", "C", "D", "E", "B", "C", "A", "B", "A", "A", "E", "C", "B", "A", "B", "C", "A", "E", "D", "B", "C", "D", "C", "B", "E", "A", "C", "A", "E"]
      };
      this.renderComparisonPage(dummyPartner);
      return;
    }

    this.showModal({
      title: '연인과 비교하기',
      message: '상대방의 고유 ID(UID)를 입력해주세요.',
      type: 'prompt',
      onConfirm: async (partnerId) => {
        if (!partnerId || partnerId.trim() === "") return;
        try {
          const docRef = doc(db, "results", partnerId.trim());
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            this.renderComparisonPage(docSnap.data());
          } else {
            this.showModal({ title: '알림', message: '해당 ID의 결과를 찾을 수 없습니다.' });
          }
        } catch (error) {
          console.error("Comparison Error:", error);
          this.showModal({ title: '오류', message: '데이터를 불러오는 중 문제가 발생했습니다.' });
        }
      }
    });
  }

  renderComparisonPage(partner) {
    this.showView('comparison');
    const myPrimary = Object.entries(this.scores).sort((a, b) => b[1] - a[1])[0][0];
    const partnerPrimary = Object.entries(partner.scores).sort((a, b) => b[1] - a[1])[0][0];

    document.getElementById('comparison-summary').innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 20px; border-radius: 20px; box-shadow: var(--shadow); margin-bottom: 20px;">
        <div style="text-align: center; flex:1;">
          <div style="font-size: 0.7rem; color: #888; margin-bottom: 5px;">나의 주 언어</div>
          <div style="font-size: 1rem; font-weight: 800; color: var(--primary-color);">${this.labels[myPrimary]}</div>
        </div>
        <div style="font-size: 1.5rem; margin: 0 10px;">💕</div>
        <div style="text-align: center; flex:1;">
          <div style="font-size: 0.7rem; color: #888; margin-bottom: 5px;">상대 주 언어</div>
          <div style="font-size: 1rem; font-weight: 800; color: #2575fc;">${this.labels[partnerPrimary]}</div>
        </div>
      </div>
    `;

    const tableContainer = document.getElementById('comparison-table-container');
    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    table.style.cssText = `width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.4); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow);`;
    table.innerHTML = `
      <tr style="background: rgba(0,0,0,0.05);">
        <th style="padding: 15px; font-size: 0.8rem; text-align: left;">항목 (클릭 시 분석)</th>
        <th style="padding: 15px; font-size: 0.8rem;">나</th>
        <th style="padding: 15px; font-size: 0.8rem;">상대</th>
      </tr>
    `;

    Object.entries(this.labels).forEach(([type, label]) => {
      const row = document.createElement('tr');
      row.style.cssText = 'border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer; transition: background 0.2s;';
      row.onclick = () => this.renderComparisonDetails(type, label, partner);
      row.innerHTML = `
        <td style="padding: 15px; text-align: left; font-weight: 600; font-size: 0.85rem;">${label}</td>
        <td style="padding: 15px; font-weight: 800; color: var(--primary-color);">${this.scores[type]}</td>
        <td style="padding: 15px; font-weight: 800; color: #2575fc;">${partner.scores[type]}</td>
      `;
      table.appendChild(row);
    });
    tableContainer.appendChild(table);
    document.getElementById('comparison-details').innerHTML = `<div style="margin-top: 20px; text-align: center; color: #888; font-size: 0.85rem;">항목을 클릭하여 세부 차이점을 확인하세요.</div>`;
  }

  renderComparisonDetails(type, label, partner) {
    const relatedQuestions = questions.filter(q => q.options.some(o => o.type === type));
    let html = `<div style="margin-top: 20px; text-align: left; animation: fadeIn 0.4s ease-out;">
      <h4 style="margin-bottom: 15px; padding-left: 10px; border-left: 4px solid var(--primary-color);">🤔 ${label} 차이점 분석</h4>`;

    let diffCount = 0;
    relatedQuestions.forEach(q => {
      const myChoiceType = this.answers[q.id - 1];
      const partnerChoiceType = partner.answers[q.id - 1];
      if (myChoiceType !== partnerChoiceType) {
        diffCount++;
        const myText = q.options[myChoiceType === q.options[0].type ? 0 : 1].text;
        const partnerText = q.options[partnerChoiceType === q.options[0].type ? 0 : 1].text;
        html += `
          <div style="background: white; padding: 15px; border-radius: 15px; box-shadow: var(--shadow); margin-bottom: 12px; font-size: 0.8rem;">
            <div style="font-weight: 800; color: #555; margin-bottom: 8px;">문항 ${q.id}</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="padding: 8px; background: #fff5f7; border-radius: 8px; color: var(--primary-color);"><strong>나:</strong> ${myText}</div>
              <div style="padding: 8px; background: #f0f7ff; border-radius: 8px; color: #2575fc;"><strong>상대:</strong> ${partnerText}</div>
            </div>
          </div>
        `;
      }
    });

    if (diffCount === 0) html += `<div style="background: white; padding: 30px; border-radius: 15px; text-align: center; color: #888;">이 항목은 두 분의 생각이 완벽히 일치합니다! 💖</div>`;

    html += `</div>`;
    const container = document.getElementById('comparison-details');
    container.innerHTML = html;
    container.scrollIntoView({ behavior: 'smooth' });
  }

  renderChart() {
    const resultsContainer = document.getElementById('results-chart');
    resultsContainer.innerHTML = '';

    const table = document.createElement('table');
    table.style.cssText = `width: 100%; border-collapse: collapse; margin-top: 20px; background: rgba(255, 255, 255, 0.3); border-radius: 12px; overflow: hidden;`;
    table.innerHTML = `<tr style="background: rgba(255, 117, 140, 0.2);"><th style="padding: 12px; text-align: left;">항목 (상세보기)</th><th style="padding: 12px;">점수</th></tr>`;

    Object.entries(this.scores).forEach(([type, score]) => {
      const row = document.createElement('tr');
      row.style.cssText = 'border-bottom: 1px solid var(--glass-border); cursor: pointer; transition: background 0.2s;';
      row.onclick = () => this.showCategoryDetails(type, this.labels[type]);
      row.innerHTML = `<td style="padding: 12px; text-align: left; font-weight: 600;">${this.labels[type]}</td><td style="padding: 12px; font-weight: 800; color: var(--primary-color);">${score}</td>`;
      table.appendChild(row);
    });
    resultsContainer.appendChild(table);
  }

  showCategoryDetails(type, label) {
    const relatedQuestions = questions.filter(q => q.options.some(o => o.type === type));
    let html = `<div style="text-align: left; margin-top: 15px; padding: 15px; background: white; border-radius: 12px; font-size: 0.85rem; box-shadow: var(--shadow); animation: fadeIn 0.3s ease-out;">
      <h4 style="margin-bottom: 10px;">🔍 ${label} 상세 분석</h4>`;
    relatedQuestions.forEach(q => {
      const myChoiceIdx = this.answers[q.id - 1] === q.options[0].type ? 0 : 1;
      const isTargetType = q.options[myChoiceIdx].type === type;
      html += `<div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;"><strong>Q${q.id}</strong>: ${q.options[myChoiceIdx].text} ${isTargetType ? '✅' : ''}</div>`;
    });
    html += `<button onclick="this.parentElement.remove()" style="margin-top:10px; width:100%; padding:8px; background:#f0f0f0; border:none; border-radius:8px; cursor:pointer;">닫기</button></div>`;

    let detailArea = document.getElementById('detail-area-results');
    if (!detailArea) {
      detailArea = document.createElement('div');
      detailArea.id = 'detail-area-results';
      document.getElementById('results-description').appendChild(detailArea);
    }
    detailArea.innerHTML = html;
    detailArea.scrollIntoView({ behavior: 'smooth' });
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  new LoveLanguageApp();
});
