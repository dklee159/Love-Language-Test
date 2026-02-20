# 5가지 사랑의 언어 테스트 (Love Language Test) 👩‍❤️‍👨

이 프로젝트는 커플이나 친구 사이에서 서로의 '사랑의 언어'를 진단하고 결과를 비교해볼 수 있는 웹 애플리케이션입니다.

## ✨ 주요 기능
- **구글 로그인**: Firebase Auth를 연동하여 간편하게 로그인.
- **사랑의 언어 진단**: 30개의 문항을 통해 5가지 유형(인정하는 말, 함께하는 시간, 선물, 봉사, 스킨십) 중 나의 주 언어를 파악.
- **결과 저장 및 시각화**: Firestore에 결과를 저장하고 표 형식으로 점수 확인.
- **연인과 비교하기**: 파트너의 UID를 입력하여 두 사람의 성향 차이를 문항별로 상세 분석.
- **재로그인 환영 UI**: 기존 결과가 있는 사용자를 위한 맞춤 화면 및 데이터 보호 기능.

## 🛠 기술 스택
- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **UI/UX**: Glassmorphism 디자인, Mesh Gradient 배경, 커텀 모달 시스템

## 🚀 시작하기

### 1. Firebase 프로젝트 설정
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트를 생성합니다.
2. **Authentication**: Google 로그인을 활성화합니다.
3. **Firestore Database**: 데이터베이스를 생성하고 아래 규칙을 적용합니다.
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /results/{userId} {
         allow create, update: if request.auth != null && request.auth.uid == userId;
         allow read: if true;
         allow delete: if false;
       }
     }
   }
   ```
4. 프로젝트 설정을 열어 발급받은 `firebaseConfig`를 확인합니다.

### 2. 로컬 설정
1. 이 레포지토리를 클론합니다.
2. `firebase-config.js.example` 파일을 복사하여 `firebase-config.js`를 만듭니다.
3. 확인한 `firebaseConfig` 값을 `firebase-config.js`에 입력합니다.

### 3. 배포 (Firebase Hosting)
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

## 📄 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다.
