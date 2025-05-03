# 디지털 메뉴판 (Flask 기반)

Flask 기반의 디지털 메뉴판 웹 애플리케이션입니다. 이 프로젝트는 레스토랑, 카페, 음식점 등을 위한 디지털 메뉴판을 쉽게 디자인하고 관리할 수 있는 솔루션을 제공합니다.

## 주요 기능

- 드래그 앤 드롭 방식의 직관적인 디자인 에디터
- 메뉴 카테고리 및 항목 관리
- 실시간 메뉴판 업데이트
- 사용자 계정 관리
- 반응형 디자인으로 모바일 지원

## 기술 스택

- **백엔드**: Python, Flask, SQLAlchemy
- **데이터베이스**: SQLite (개발) / PostgreSQL (프로덕션)
- **프론트엔드**: HTML, CSS, JavaScript, Bootstrap 5, Fabric.js
- **인증**: Flask-Login

## 개발 환경 설정

### 필수 요구사항

- Python 3.8 이상
- pip (파이썬 패키지 관리자)

### 설치 방법

1. 저장소 클론하기:
   ```bash
   git clone https://github.com/your-username/python-menu-board.git
   cd python-menu-board
   ```

2. 가상 환경 생성 및 활성화:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # MacOS/Linux
   source venv/bin/activate
   ```

3. 패키지 설치:
   ```bash
   pip install -r requirements.txt
   ```

4. 환경 변수 설정:
   ```bash
   # .env 파일 생성
   touch .env
   # .env 파일에 아래 내용 추가
   SECRET_KEY=your-secret-key
   DATABASE_URI=sqlite:///menu_board.db
   ```

5. 데이터베이스 초기화:
   ```bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

6. 애플리케이션 실행:
   ```bash
   python app.py
   ```

7. 웹 브라우저에서 `http://localhost:5000` 접속

## 배포 방법

### Heroku 배포

1. Heroku CLI 설치
2. Heroku 로그인:
   ```bash
   heroku login
   ```
3. Heroku 앱 생성:
   ```bash
   heroku create your-app-name
   ```
4. Procfile 생성:
   ```
   web: gunicorn app:app
   ```
5. 환경 변수 설정:
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set DATABASE_URI=$DATABASE_URL
   ```
6. 앱 배포:
   ```bash
   git push heroku main
   ```
7. 데이터베이스 마이그레이션:
   ```bash
   heroku run flask db upgrade
   ```

## 프로젝트 구조

```
python_menu_board/
├── app/
│   ├── models/            # 데이터베이스 모델
│   ├── routes/            # 라우트 함수
│   ├── static/            # 정적 파일 (CSS, JS)
│   └── templates/         # HTML 템플릿
├── migrations/            # 데이터베이스 마이그레이션
├── app.py                 # 애플리케이션 진입점
├── requirements.txt       # 필수 패키지 목록
└── README.md              # 프로젝트 문서
```

## 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다.

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature-name`
3. 변경사항을 커밋합니다: `git commit -m 'Add some feature'`
4. 브랜치에 푸시합니다: `git push origin feature-name`
5. Pull Request를 제출합니다.

## 연락처

문의사항은 [your-email@example.com](mailto:your-email@example.com)로 보내주세요. 