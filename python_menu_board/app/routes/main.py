from flask import Blueprint, render_template, jsonify
from flask_login import login_required, current_user

from app.models.design import Design
from app.models.menu import Category, MenuItem

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """메인 페이지"""
    # 최근 디자인 5개 가져오기
    recent_designs = Design.query.order_by(Design.created_at.desc()).limit(5).all()
    
    return render_template('index.html', recent_designs=recent_designs)

@main_bp.route('/dashboard')
@login_required
def dashboard():
    """대시보드 페이지"""
    # 현재 사용자의 디자인 수
    user_designs_count = Design.query.filter_by(user_id=current_user.id).count()
    
    # 메뉴 카테고리 수
    categories_count = Category.query.count()
    
    # 메뉴 아이템 수
    menu_items_count = MenuItem.query.count()
    
    # 최근 디자인 5개
    recent_designs = Design.query.filter_by(user_id=current_user.id) \
        .order_by(Design.created_at.desc()).limit(5).all()
    
    return render_template(
        'dashboard.html',
        user_designs_count=user_designs_count,
        categories_count=categories_count,
        menu_items_count=menu_items_count,
        recent_designs=recent_designs
    )

@main_bp.route('/about')
def about():
    """소개 페이지"""
    return render_template('about.html')

@main_bp.app_errorhandler(404)
def page_not_found(e):
    """404 에러 페이지"""
    return render_template('errors/404.html'), 404

@main_bp.app_errorhandler(500)
def internal_server_error(e):
    """500 에러 페이지"""
    return render_template('errors/500.html'), 500 