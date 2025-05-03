import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 인스턴스 생성
db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    
    # 설정
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-development')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URI', 'sqlite:///menu_board.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 확장 모듈 초기화
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    
    # 로그인 설정
    login_manager.login_view = 'auth.login'
    login_manager.login_message = '이 페이지에 접근하려면 로그인이 필요합니다.'
    
    # 블루프린트 등록
    from app.routes.auth import auth_bp
    from app.routes.main import main_bp
    from app.routes.menu import menu_bp
    from app.routes.design import design_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(menu_bp)
    app.register_blueprint(design_bp)
    
    # 데이터베이스 생성
    with app.app_context():
        db.create_all()
    
    return app 