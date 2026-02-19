# Firebase 설정 가이드라인 (사랑의 언어 테스트)

이 가이드를 따라 Firebase 프로젝트를 생성하고 API 키를 발급받으세요.

## 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에 접속합니다.
2. **"프로젝트 추가"**를 클릭하고 이름을 입력합니다 (예: `love-language-test`).
3. Google 애널리틱스 설정은 선택 사항입니다 (해제해도 무관합니다).

## 2. 웹 앱 등록 및 API 키 발급
1. 프로젝트 대시보드 중앙의 **웹 아이콘 (< />)**을 클릭합니다.
2. 앱 닉네임을 입력하고 **"앱 등록"**을 클릭합니다.
3. 화면에 나타나는 `firebaseConfig` 객체 안의 값들을 복사해 두세요. (`apiKey`, `authDomain` 등)

## 3. 기능 활성화 (로그인 & 데이터베이스)
### 구글 로그인 활성화
1. 왼쪽 메뉴의 **Build > Authentication**으로 들어갑니다.
2. **Get Started**를 누르고 **Sign-in method** 탭에서 **Google**을 선택합니다.
3. 활성화(Enable) 스위치를 켜고 프로젝트 지원 이메일을 선택한 뒤 **저장**합니다.

### 데이터베이스(Firestore) 생성
1. 왼쪽 메뉴의 **Build > Firestore Database**로 들어갑니다.
2. **Create database**를 클릭합니다.
3. **Start in test mode**를 선택하여 개발 중에는 자유롭게 읽고 쓸 수 있게 합니다. (나중에 보안 규칙 수정 필요)
4. 위치(Location)는 가까운 곳(`asia-northeast3` 등)을 선택합니다.

## 4. 코드 적용
복사한 API 키 정보를 `firebase-config.js` 파일에 붙여넣으세요.
