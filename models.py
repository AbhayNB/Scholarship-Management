from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy import Float
db = SQLAlchemy()

# Association table between User and Role
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    roles = relationship('Role', secondary=user_roles, backref=db.backref('users', lazy=True))
    

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)

# Scholarship Application Model
class ScholarshipApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')
    application_date = db.Column(db.DateTime, nullable=False)
    income_certificate = db.Column(db.String(200), nullable=True)
    marksheet = db.Column(db.String(200), nullable=True)
    sop = db.Column(db.String(200), nullable=True)

    def __repr__(self):
        return f'<ScholarshipApplication {self.id}>'
class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    hod_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
class Finance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dept_id=db.Column(db.Integer, db.ForeignKey('department.id'), nullable=False)
    budget=db.Column(Float(),nullable=False)