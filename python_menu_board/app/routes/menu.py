from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash, abort
from flask_login import login_required, current_user
from datetime import datetime

from app import db
from app.models.menu import Category, MenuItem

menu_bp = Blueprint('menu', __name__, url_prefix='/menu')

# 카테고리 관련 라우트
@menu_bp.route('/categories')
@login_required
def categories():
    """카테고리 목록 페이지"""
    categories = Category.query.order_by(Category.display_order).all()
    return render_template('menu/categories.html', categories=categories)

@menu_bp.route('/categories/create', methods=['GET', 'POST'])
@login_required
def create_category():
    """새 카테고리 생성 페이지"""
    if request.method == 'POST':
        try:
            name = request.form.get('name')
            description = request.form.get('description', '')
            display_order = request.form.get('display_order', 0)
            
            # 유효성 검증
            if not name:
                flash('카테고리 이름은 필수 항목입니다.', 'danger')
                return render_template('menu/create_category.html')
            
            # 새 카테고리 생성
            category = Category(
                name=name,
                description=description,
                display_order=int(display_order) if display_order else 0
            )
            
            db.session.add(category)
            db.session.commit()
            
            flash('카테고리가 생성되었습니다.', 'success')
            return redirect(url_for('menu.categories'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'카테고리 생성 실패: {str(e)}', 'danger')
    
    return render_template('menu/create_category.html')

@menu_bp.route('/categories/<int:category_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_category(category_id):
    """카테고리 수정 페이지"""
    category = Category.query.get_or_404(category_id)
    
    if request.method == 'POST':
        try:
            name = request.form.get('name')
            description = request.form.get('description', '')
            display_order = request.form.get('display_order', 0)
            
            # 유효성 검증
            if not name:
                flash('카테고리 이름은 필수 항목입니다.', 'danger')
                return render_template('menu/edit_category.html', category=category)
            
            # 카테고리 업데이트
            category.name = name
            category.description = description
            category.display_order = int(display_order) if display_order else 0
            category.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            flash('카테고리가 업데이트되었습니다.', 'success')
            return redirect(url_for('menu.categories'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'카테고리 업데이트 실패: {str(e)}', 'danger')
    
    return render_template('menu/edit_category.html', category=category)

@menu_bp.route('/categories/<int:category_id>/delete', methods=['POST'])
@login_required
def delete_category(category_id):
    """카테고리 삭제"""
    category = Category.query.get_or_404(category_id)
    
    try:
        # 연결된 메뉴 항목도 함께 삭제
        MenuItem.query.filter_by(category_id=category_id).delete()
        
        db.session.delete(category)
        db.session.commit()
        
        flash('카테고리가 삭제되었습니다.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'카테고리 삭제 실패: {str(e)}', 'danger')
    
    return redirect(url_for('menu.categories'))

# 메뉴 항목 관련 라우트
@menu_bp.route('/items')
@login_required
def items():
    """메뉴 항목 목록 페이지"""
    # 카테고리별로 메뉴 항목 그룹화
    categories = Category.query.order_by(Category.display_order).all()
    return render_template('menu/items.html', categories=categories)

@menu_bp.route('/items/create', methods=['GET', 'POST'])
@login_required
def create_item():
    """새 메뉴 항목 생성 페이지"""
    categories = Category.query.order_by(Category.name).all()
    
    if not categories:
        flash('메뉴 항목을 생성하기 전에 카테고리를 먼저 생성해주세요.', 'warning')
        return redirect(url_for('menu.create_category'))
    
    if request.method == 'POST':
        try:
            name = request.form.get('name')
            price = request.form.get('price')
            category_id = request.form.get('category_id')
            description = request.form.get('description', '')
            discount_price = request.form.get('discount_price')
            display_order = request.form.get('display_order', 0)
            is_available = 'is_available' in request.form
            is_featured = 'is_featured' in request.form
            
            # 이미지 처리
            image = None
            if 'image' in request.files and request.files['image'].filename:
                image_file = request.files['image']
                # 실제 프로젝트에서는 이미지를 저장하고 경로를 DB에 저장해야 함
                # 여기서는 간단하게 Base64로 인코딩하여 처리
                import base64
                from io import BytesIO
                
                buffered = BytesIO()
                image_file.save(buffered)
                image = f"data:{image_file.content_type};base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"
            
            # 유효성 검증
            if not name or not price or not category_id:
                flash('이름, 가격, 카테고리는 필수 항목입니다.', 'danger')
                return render_template('menu/create_item.html', categories=categories)
            
            # 새 메뉴 항목 생성
            menu_item = MenuItem(
                name=name,
                price=float(price),
                category_id=int(category_id),
                description=description,
                discount_price=float(discount_price) if discount_price else None,
                image=image,
                is_available=is_available,
                is_featured=is_featured,
                display_order=int(display_order) if display_order else 0
            )
            
            db.session.add(menu_item)
            db.session.commit()
            
            flash('메뉴 항목이 생성되었습니다.', 'success')
            return redirect(url_for('menu.items'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'메뉴 항목 생성 실패: {str(e)}', 'danger')
    
    return render_template('menu/create_item.html', categories=categories)

@menu_bp.route('/items/<int:item_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_item(item_id):
    """메뉴 항목 수정 페이지"""
    menu_item = MenuItem.query.get_or_404(item_id)
    categories = Category.query.order_by(Category.name).all()
    
    if request.method == 'POST':
        try:
            name = request.form.get('name')
            price = request.form.get('price')
            category_id = request.form.get('category_id')
            description = request.form.get('description', '')
            discount_price = request.form.get('discount_price')
            display_order = request.form.get('display_order', 0)
            is_available = 'is_available' in request.form
            is_featured = 'is_featured' in request.form
            
            # 이미지 처리
            if 'image' in request.files and request.files['image'].filename:
                image_file = request.files['image']
                # 실제 프로젝트에서는 이미지를 저장하고 경로를 DB에 저장해야 함
                # 여기서는 간단하게 Base64로 인코딩하여 처리
                import base64
                from io import BytesIO
                
                buffered = BytesIO()
                image_file.save(buffered)
                menu_item.image = f"data:{image_file.content_type};base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"
            
            # 유효성 검증
            if not name or not price or not category_id:
                flash('이름, 가격, 카테고리는 필수 항목입니다.', 'danger')
                return render_template('menu/edit_item.html', item=menu_item, categories=categories)
            
            # 메뉴 항목 업데이트
            menu_item.name = name
            menu_item.price = float(price)
            menu_item.category_id = int(category_id)
            menu_item.description = description
            menu_item.discount_price = float(discount_price) if discount_price else None
            menu_item.is_available = is_available
            menu_item.is_featured = is_featured
            menu_item.display_order = int(display_order) if display_order else 0
            menu_item.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            flash('메뉴 항목이 업데이트되었습니다.', 'success')
            return redirect(url_for('menu.items'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'메뉴 항목 업데이트 실패: {str(e)}', 'danger')
    
    return render_template('menu/edit_item.html', item=menu_item, categories=categories)

@menu_bp.route('/items/<int:item_id>/delete', methods=['POST'])
@login_required
def delete_item(item_id):
    """메뉴 항목 삭제"""
    menu_item = MenuItem.query.get_or_404(item_id)
    
    try:
        db.session.delete(menu_item)
        db.session.commit()
        
        flash('메뉴 항목이 삭제되었습니다.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'메뉴 항목 삭제 실패: {str(e)}', 'danger')
    
    return redirect(url_for('menu.items'))

# API 엔드포인트
@menu_bp.route('/api/categories')
def api_categories():
    """카테고리 API"""
    categories = Category.query.order_by(Category.display_order).all()
    return jsonify({
        'success': True,
        'data': [category.to_dict() for category in categories]
    })

@menu_bp.route('/api/categories/<int:category_id>/items')
def api_category_items(category_id):
    """카테고리별 메뉴 항목 API"""
    category = Category.query.get_or_404(category_id)
    menu_items = MenuItem.query.filter_by(category_id=category_id) \
        .order_by(MenuItem.display_order).all()
    
    return jsonify({
        'success': True,
        'category': category.to_dict(),
        'menu_items': [item.to_dict() for item in menu_items]
    })

@menu_bp.route('/api/items/<int:item_id>')
def api_item(item_id):
    """메뉴 항목 상세 API"""
    menu_item = MenuItem.query.get_or_404(item_id)
    return jsonify({
        'success': True,
        'data': menu_item.to_dict()
    }) 