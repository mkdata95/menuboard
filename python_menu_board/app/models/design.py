from datetime import datetime
import json

from app import db

class Design(db.Model):
    __tablename__ = 'designs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    background_image = db.Column(db.Text, nullable=True)  # Base64 또는 URL로 저장
    canvas_data = db.Column(db.Text, nullable=True)  # JSON 형태로 캔버스 데이터 저장
    text_content = db.Column(db.Text, nullable=True)
    price_info = db.Column(db.String(255), nullable=True)
    video_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 외래 키
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def __init__(self, name, user_id, background_image=None, canvas_data=None, 
                 text_content=None, price_info=None, video_url=None):
        self.name = name
        self.user_id = user_id
        self.background_image = background_image
        self.canvas_data = canvas_data
        self.text_content = text_content
        self.price_info = price_info
        self.video_url = video_url
    
    def to_dict(self):
        """디자인 객체를 JSON 데이터로 직렬화합니다."""
        return {
            'id': self.id,
            'name': self.name,
            'background_image': self.background_image,
            'canvas_data': self.canvas_data,
            'text_content': self.text_content,
            'price_info': self.price_info,
            'video_url': self.video_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id
        }
    
    def set_canvas_data(self, canvas_dict):
        """캔버스 데이터를 JSON으로 변환하여 저장합니다."""
        self.canvas_data = json.dumps(canvas_dict)
    
    def get_canvas_data(self):
        """저장된 JSON 캔버스 데이터를 딕셔너리로 반환합니다."""
        if self.canvas_data:
            try:
                return json.loads(self.canvas_data)
            except json.JSONDecodeError:
                return None
        return None
    
    def __repr__(self):
        return f'<Design {self.name}>' 