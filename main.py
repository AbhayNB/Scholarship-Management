from flask import Flask, jsonify, request,render_template,redirect, url_for,flash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from config import Config
from models import db, User, Role,ScholarshipApplication
from flask_cors import CORS
from datetime import datetime
from flask_restful import Api
from werkzeug.security import generate_password_hash
from flask_cors import cross_origin
app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
api = Api(app)
jwt = JWTManager(app)
CORS(app)

#==== Auth
@app.before_first_request
def create_tables():
    db.create_all()
    # Create default roles
    if not Role.query.filter_by(name='student').first():
        db.session.add(Role(name='student'))
    if not Role.query.filter_by(name='hod').first():
        db.session.add(Role(name='hod'))
    if not Role.query.filter_by(name='principal').first():
        db.session.add(Role(name='principal'))
    if not Role.query.filter_by(name='finance').first():
        db.session.add(Role(name='finance'))
    db.session.commit()

@app.route('/register', methods=['POST'])
@cross_origin()
def register():
    username = request.json.get('username')
    password = request.json.get('password')
    role_name = request.json.get('role', 'user')  # Default role is 'user'

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "User already exists"}), 400

    user_role = Role.query.filter_by(name=role_name).first()
    if not user_role:
        return jsonify({"message": "Invalid role"}), 400

    new_user = User(username=username)
    new_user.set_password(password)
    new_user.roles.append(user_role)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid username or password"}), 401

    access_token = create_access_token(identity={'username': user.username, 'roles': [role.name for role in user.roles]})
    return jsonify(access_token=access_token,id=user.id,username=user.username,role=[role.name for role in user.roles])

from auth import role_required

@app.route('/admin', methods=['GET'])
@role_required('admin')
def admin_only():
    return jsonify(message="Welcome, admin!"), 200

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user['username'], roles=current_user['roles']), 200

@app.route('/user/details', methods=['GET'])
@jwt_required()  # Ensure the request is authenticated
def get_user_details():
    # Get the identity of the current user from the JWT token
    current_user = get_jwt_identity()
    
    # Retrieve the user from the database based on the identity
    user = User.query.filter_by(username=current_user['username']).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    # Format user data to return
    user_data = {
        'id': user.id,
        'username': user.username,
        'roles': [role.name for role in user.roles]
    }

    return jsonify(user=user_data), 200

@app.route('/register_', methods=['GET', 'POST'])
def register_():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if not username or not password:
            flash('Please enter both a username and password.')
            return redirect(url_for('register_'))

        # Check if the username already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash('Username already exists. Please choose a different one.')
            return redirect(url_for('register_'))

        # Hash the password and save the new user
        password_hash = generate_password_hash(password)
        new_user = User(username=username, password_hash=password_hash)
        db.session.add(new_user)
        db.session.commit()

        flash('Registration successful! Please log in.')
        return redirect(url_for('login'))

    return render_template('register.html')


# =========Api
# from api import AddBookResource,GetAllSectionsResource,GetAllBooksResource,CreateSectionResource

# api.add_resource(AddBookResource, '/add_book')
# api.add_resource(GetAllSectionsResource, '/sections')
# api.add_resource(GetAllBooksResource, '/books')
# api.add_resource(CreateSectionResource, '/create_sections')


import datetime
import os
from werkzeug.utils import secure_filename
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']
@app.route('/apply', methods=['GET', 'POST'])
def apply_scholarship():
    if request.method == 'POST':
        student_id = request.form['student_id']
        department_id = request.form['department_id']
        
        income_certificate = None
        marksheet = None
        sop = None
        
        # Handle file uploads
        if 'income_certificate' in request.files and allowed_file(request.files['income_certificate'].filename):
            income_certificate = secure_filename(request.files['income_certificate'].filename)
            request.files['income_certificate'].save(os.path.join(app.config['UPLOAD_FOLDER'], income_certificate))
        
        if 'marksheet' in request.files and allowed_file(request.files['marksheet'].filename):
            marksheet = secure_filename(request.files['marksheet'].filename)
            request.files['marksheet'].save(os.path.join(app.config['UPLOAD_FOLDER'], marksheet))
        
        if 'sop' in request.files and allowed_file(request.files['sop'].filename):
            sop = secure_filename(request.files['sop'].filename)
            request.files['sop'].save(os.path.join(app.config['UPLOAD_FOLDER'], sop))
        
        # Save application to the database
        application = ScholarshipApplication(
            student_id=student_id,
            department_id=department_id,
            status='pending',
            application_date=datetime.datetime.now(),
            income_certificate=income_certificate,
            marksheet=marksheet,
            sop=sop
        )
        
        db.session.add(application)
        db.session.commit()
        
        return jsonify({"message": "Application submitted successfully!"}), 201

    return render_template('scholarship_form.html')


@app.route('/applications', methods=['GET'])
def get_applications():
    applications = ScholarshipApplication.query.all()
    return jsonify([{
        'id': app.id,
        'student_id': app.student_id,
        'department_id': app.department_id,
        'status': app.status,
        'application_date': app.application_date.isoformat(),
        'income_certificate': app.income_certificate,
        'marksheet': app.marksheet,
        'sop': app.sop
    } for app in applications])

# ===== Index
@app.route('/')
def index():
    return render_template('index.html')
@app.route('/admin_page')
def admin():
    return render_template('admin.html')
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
