from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash, abort
from flask_login import login_required, current_user
import json
import base64
import re
from datetime import datetime

from app import db
from app.models.design import Design

design_bp = Blueprint('design', __name__, url_prefix='/designs')

@design_bp.route('/')
@login_required
def index():
    """디자인 목록 페이지"""
    designs = Design.query.filter_by(user_id=current_user.id).order_by(Design.updated_at.desc()).all()
    return render_template('designs/index.html', designs=designs)

@design_bp.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    """새 디자인 생성 페이지"""
    if request.method == 'POST':
        try:
            # 요청 데이터
            data = request.get_json()
            
            name = data.get('name')
            background_image = data.get('background_image')
            canvas_data = data.get('canvas_data')
            text_content = data.get('text_content', '')
            price_info = data.get('price_info', '')
            video_url = data.get('video_url', '')
            
            # 유효성 검증
            if not name:
                return jsonify({'success': False, 'message': '디자인 이름은 필수 항목입니다.'}), 400
            
            # 새 디자인 생성
            design = Design(
                name=name,
                user_id=current_user.id,
                background_image=background_image,
                canvas_data=canvas_data,
                text_content=text_content,
                price_info=price_info,
                video_url=video_url
            )
            
            db.session.add(design)
            db.session.commit()
            
            return jsonify({
                'success': True, 
                'message': '디자인이 생성되었습니다.',
                'design_id': design.id
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'디자인 생성 실패: {str(e)}'}), 500
    
    return render_template('designs/create.html')

@design_bp.route('/<int:design_id>', methods=['GET'])
@login_required
def view(design_id):
    """디자인 상세 보기 페이지"""
    design = Design.query.get_or_404(design_id)
    
    # 권한 확인
    if design.user_id != current_user.id and not current_user.is_admin:
        abort(403)
    
    return render_template('designs/view.html', design=design)

@design_bp.route('/<int:design_id>/edit', methods=['GET', 'POST'])
@login_required
def edit(design_id):
    """디자인 수정 페이지"""
    design = Design.query.get_or_404(design_id)
    
    # 권한 확인
    if design.user_id != current_user.id and not current_user.is_admin:
        abort(403)
    
    if request.method == 'POST':
        try:
            # 요청 데이터
            data = request.get_json()
            
            name = data.get('name')
            background_image = data.get('background_image')
            canvas_data = data.get('canvas_data')
            text_content = data.get('text_content', '')
            price_info = data.get('price_info', '')
            video_url = data.get('video_url', '')
            
            # 유효성 검증
            if not name:
                return jsonify({'success': False, 'message': '디자인 이름은 필수 항목입니다.'}), 400
            
            # 디자인 업데이트
            design.name = name
            design.background_image = background_image if background_image else design.background_image
            design.canvas_data = canvas_data
            design.text_content = text_content
            design.price_info = price_info
            design.video_url = video_url
            design.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return jsonify({
                'success': True, 
                'message': '디자인이 업데이트되었습니다.',
                'design_id': design.id
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'디자인 업데이트 실패: {str(e)}'}), 500
    
    return render_template('designs/edit.html', design=design)

@design_bp.route('/<int:design_id>', methods=['DELETE'])
@login_required
def delete(design_id):
    """디자인 삭제"""
    design = Design.query.get_or_404(design_id)
    
    # 권한 확인
    if design.user_id != current_user.id and not current_user.is_admin:
        abort(403)
    
    try:
        db.session.delete(design)
        db.session.commit()
        return jsonify({'success': True, 'message': '디자인이 삭제되었습니다.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'디자인 삭제 실패: {str(e)}'}), 500

@design_bp.route('/<int:design_id>/preview')
def preview(design_id):
    """디자인 미리보기 페이지 (로그인 불필요)"""
    design = Design.query.get_or_404(design_id)
    return render_template('designs/preview.html', design=design)

@design_bp.route('/<int:design_id>/data')
def get_design_data(design_id):
    """디자인 데이터 API (미리보기용)"""
    try:
        design = Design.query.get_or_404(design_id)
        design_data = design.to_dict()
        
        # 캔버스 데이터가 있으면 유효성 확인
        if design_data['canvas_data']:
            try:
                # 캔버스 데이터가 유효한 JSON인지 확인
                json.loads(design_data['canvas_data'])
            except json.JSONDecodeError as e:
                # JSON 파싱 오류 시 None으로 설정
                design_data['canvas_data'] = None
                print(f"캔버스 데이터 파싱 오류 (디자인 ID: {design_id}): {str(e)}")
        
        # 응답 전 변환과정 기록
        print(f"디자인 데이터 변환 완료 (ID: {design_id}), 캔버스 데이터 존재: {bool(design_data['canvas_data'])}")
        
        return jsonify({
            'success': True,
            'data': design_data
        })
    except Exception as e:
        print(f"디자인 데이터 조회 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"디자인 데이터 조회 오류: {str(e)}"
        }), 500 