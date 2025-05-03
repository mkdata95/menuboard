from datetime import datetime

from app import db

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계
    menu_items = db.relationship('MenuItem', backref='category', lazy='dynamic')
    
    def __init__(self, name, description=None, display_order=0):
        self.name = name
        self.description = description
        self.display_order = display_order
    
    def to_dict(self):
        """카테고리 객체를 딕셔너리로 변환합니다."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Category {self.name}>'


class MenuItem(db.Model):
    __tablename__ = 'menu_items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    discount_price = db.Column(db.Float, nullable=True)
    image = db.Column(db.Text, nullable=True)  # Base64 또는 URL로 저장
    is_available = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 외래 키
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    
    def __init__(self, name, price, category_id, description=None, 
                 discount_price=None, image=None, is_available=True, 
                 is_featured=False, display_order=0):
        self.name = name
        self.price = price
        self.category_id = category_id
        self.description = description
        self.discount_price = discount_price
        self.image = image
        self.is_available = is_available
        self.is_featured = is_featured
        self.display_order = display_order
    
    def to_dict(self):
        """메뉴 항목 객체를 딕셔너리로 변환합니다."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'discount_price': self.discount_price,
            'image': self.image,
            'is_available': self.is_available,
            'is_featured': self.is_featured,
            'display_order': self.display_order,
            'category_id': self.category_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<MenuItem {self.name}>' 