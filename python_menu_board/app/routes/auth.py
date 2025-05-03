from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.urls import url_parse

from app import db
from app.models.user import User

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """사용자 등록 기능"""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # 유효성 검증
        if not all([username, email, password, confirm_password]):
            flash('모든 필드를 입력해주세요.', 'danger')
            return render_template('auth/register.html')
        
        if password != confirm_password:
            flash('비밀번호가 일치하지 않습니다.', 'danger')
            return render_template('auth/register.html')
        
        # 사용자 중복 확인
        if User.query.filter_by(username=username).first():
            flash('이미 사용 중인 사용자 이름입니다.', 'danger')
            return render_template('auth/register.html')
        
        if User.query.filter_by(email=email).first():
            flash('이미 사용 중인 이메일입니다.', 'danger')
            return render_template('auth/register.html')
        
        # 새 사용자 생성
        user = User(username=username, email=email, password=password)
        db.session.add(user)
        db.session.commit()
        
        flash('회원 가입이 완료되었습니다. 로그인해주세요.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """사용자 로그인 기능"""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember_me = 'remember_me' in request.form
        
        print(f"로그인 시도: 사용자명={username}")
        
        # 유효성 검증
        if not all([username, password]):
            flash('사용자 이름과 비밀번호를 입력해주세요.', 'danger')
            return render_template('auth/login.html')
        
        # 사용자 검색
        user = User.query.filter_by(username=username).first()
        
        if not user:
            print(f"사용자를 찾을 수 없음: {username}")
            flash('사용자 이름 또는 비밀번호가 올바르지 않습니다.', 'danger')
            return render_template('auth/login.html')
        
        if not user.check_password(password):
            print(f"비밀번호 불일치: {username}")
            flash('사용자 이름 또는 비밀번호가 올바르지 않습니다.', 'danger')
            return render_template('auth/login.html')
        
        # 인증 성공
        login_user(user, remember=remember_me)
        print(f"로그인 성공: {username}")
        
        # 디버깅을 위해 강제로 메인 페이지로 리다이렉트
        flash('로그인 되었습니다.', 'success')
        return redirect(url_for('main.index'))
    
    return render_template('auth/login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    """사용자 로그아웃 기능"""
    logout_user()
    flash('로그아웃 되었습니다.', 'success')
    return redirect(url_for('main.index'))

@auth_bp.route('/profile')
@login_required
def profile():
    """사용자 프로필 페이지"""
    return render_template('auth/profile.html') 