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
    design_count = Design.query.filter_by(user_id=current_user.id).count()
    
    # 메뉴 카테고리 수
    category_count = Category.query.count()
    
    # 메뉴 아이템 수
    menu_count = MenuItem.query.count()
    
    # 최근 활동 데이터 생성 (실제로는 DB에서 가져와야 하지만 예시로 생성)
    # 실제 구현에서는 Activity 모델을 만들어 활동 로그를 저장하고 불러오는 것이 좋습니다
    activities = []
    
    # 최근 디자인 활동 추가
    recent_designs = Design.query.filter_by(user_id=current_user.id) \
        .order_by(Design.created_at.desc()).limit(3).all()
    
    for design in recent_designs:
        activities.append({
            'icon': 'fa-palette',
            'description': f'디자인 "{design.name}" 생성됨',
            'time': design.created_at.strftime('%Y-%m-%d %H:%M')
        })
    
    # 최근 메뉴 아이템 활동 추가
    recent_items = MenuItem.query.order_by(MenuItem.created_at.desc()).limit(3).all()
    for item in recent_items:
        activities.append({
            'icon': 'fa-utensils',
            'description': f'메뉴 항목 "{item.name}" 추가됨',
            'time': item.created_at.strftime('%Y-%m-%d %H:%M') if hasattr(item, 'created_at') and item.created_at else 'N/A'
        })
    
    # 최근 카테고리 활동 추가
    recent_categories = Category.query.order_by(Category.id.desc()).limit(3).all()
    for category in recent_categories:
        activities.append({
            'icon': 'fa-tags',
            'description': f'카테고리 "{category.name}" 추가됨',
            'time': category.created_at.strftime('%Y-%m-%d %H:%M') if hasattr(category, 'created_at') and category.created_at else 'N/A'
        })
    
    # 활동 시간순으로 정렬
    activities.sort(key=lambda x: x['time'], reverse=True)
    
    return render_template(
        'dashboard.html',
        design_count=design_count,
        category_count=category_count,
        menu_count=menu_count,
        activities=activities
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