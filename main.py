# == Imports
from flask import Flask, jsonify, request,render_template,redirect, url_for,flash,send_from_directory
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from config import Config
from models import db, User, Role,ScholarshipApplication,Department,Finance
from flask_cors import CORS
from datetime import datetime
from flask_restful import Api
from werkzeug.security import generate_password_hash
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
import datetime
import os


#====== configure
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
    department_id = request.json.get('department_id')  # Optional department_id

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "User already exists"}), 400

    user_role = Role.query.filter_by(name=role_name).first()
    if not user_role:
        return jsonify({"message": "Invalid role"}), 400

    if department_id:
        department = Department.query.get(department_id)
        if not department:
            return jsonify({"message": "Invalid department"}), 400
    else:
        department = None

    new_user = User(username=username, department_id=department_id)
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

    # Fetch the department information
    department = user.department
    department_name = department.name if department else None
    department_id = department.id if department else None

    access_token = create_access_token(
        identity={
            'username': user.username,
            'roles': [role.name for role in user.roles]
        }
    )
    
    return jsonify(
        access_token=access_token,
        id=user.id,
        username=user.username,
        roles=[role.name for role in user.roles],
        department_name=department_name,
        department_id=department_id
    )

from auth import role_required

@app.route('/admin', methods=['GET'])
@role_required('principal')
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


if not os.path.exists('/uploads'):
    os.makedirs('/uploads')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/scholarship/apply', methods=['POST'])
def apply_scholarship():
    try:
        # Ensure that required fields are present
        if not all(k in request.form for k in ("student_id", "department_id")):
            return jsonify({"error": "Missing required fields: student_id and department_id"}), 400

        student_id = request.form['student_id']
        department_id = request.form['department_id']
        
        # Handle file uploads
        income_certificate = None
        marksheet = None
        sop = None
        
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
        
        return jsonify({"message": "Application submitted successfully!", "application_id": application.id}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/apply', methods=['GET', 'POST'])
def apply_scholarship_():
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

    return render_template('submit.html')



@app.route('/applications', methods=['GET'])
def get_applications():
    department_id = request.args.get('department_id')

    # Filter applications based on department_id if provided
    if department_id:
        applications = ScholarshipApplication.query.filter_by(department_id=department_id).all()
    else:
        applications = ScholarshipApplication.query.all()

    # Serialize the applications to JSON
    return jsonify([{
        'id': app.id,
        'student_id': app.student_id,
        'department_id': app.department_id,
        'status': app.status,
        'application_date': app.application_date.isoformat(),
        'income_certificate': url_for('uploaded_file', filename=app.income_certificate) if app.income_certificate else None,
        'marksheet': url_for('uploaded_file', filename=app.marksheet) if app.marksheet else None,
        'sop': url_for('uploaded_file', filename=app.sop) if app.sop else None,
        'recommend': app.recommend,
        'feedback': app.feedback
    } for app in applications])



# Read (Get a single application)
@app.route('/applications/<int:id>', methods=['GET'])
def get_application(id):
    application = ScholarshipApplication.query.get_or_404(id)
    return jsonify({
        'id': application.id,
        'student_id': application.student_id,
        'department_id': application.department_id,
        'status': application.status,
        'application_date': application.application_date.isoformat(),
        'income_certificate': url_for('uploaded_file', filename=application.income_certificate) if application.income_certificate else None,
        'marksheet': url_for('uploaded_file', filename=application.marksheet) if application.marksheet else None,
        'sop': url_for('uploaded_file', filename=application.sop) if application.sop else None,
        'recommend': application.recommend,
        'feedback': application.feedback
    })

# Update
@app.route('/applications/<int:id>', methods=['PUT'])
def update_application(id):
    application = ScholarshipApplication.query.get_or_404(id)
    
    data = request.json

    print(data)
    if 'status' in data:
        application.status = data['status']
    if 'recommend' in data:
        application.recommend = data['recommend']
    if 'feedback' in data:
        application.feedback = data['feedback']

    # Handle file updates
    if 'income_certificate' in request.files:
        file = request.files['income_certificate']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            application.income_certificate = filename

    if 'marksheet' in request.files:
        file = request.files['marksheet']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            application.marksheet = filename

    if 'sop' in request.files:
        file = request.files['sop']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            application.sop = filename

    db.session.commit()
    return jsonify({'message': 'Application updated successfully'}), 200

# Delete
@app.route('/applications/<int:id>', methods=['DELETE'])
def delete_application(id):
    application = ScholarshipApplication.query.get_or_404(id)
    db.session.delete(application)
    db.session.commit()
    return jsonify({'message': 'Application deleted successfully'}), 200



# ====== for Department
@app.route('/departments', methods=['POST'])
def create_department():
    data = request.get_json()
    if 'name' not in data:
        return jsonify({'message': 'Name is required'}), 400
    department = Department(name=data['name'])
    db.session.add(department)
    db.session.commit()
    return jsonify({'id': department.id}), 201

@app.route('/departments', methods=['GET'])
def get_all_departments():
    departments = Department.query.all()
    result = []
    for department in departments:
        result.append({
            'id': department.id,
            'name': department.name
        })
    return jsonify(result)

@app.route('/departments/<int:department_id>', methods=['GET'])
def get_department(department_id):
    department = Department.query.get(department_id)
    if not department:
        return jsonify({'message': 'Department not found'}), 404
    return jsonify({'id': department.id, 'name': department.name})

@app.route('/departments/<int:department_id>', methods=['PUT'])
def update_department(department_id):
    data = request.get_json()
    department = Department.query.get(department_id)
    if not department:
        return jsonify({'message': 'Department not found'}), 404
    if 'name' in data:
        department.name = data['name']
        db.session.commit()
        return jsonify({'message': 'Department updated'})
    return jsonify({'message': 'No data provided'}), 400

@app.route('/departments/<int:department_id>', methods=['DELETE'])
def delete_department(department_id):
    department = Department.query.get(department_id)
    if not department:
        return jsonify({'message': 'Department not found'}), 404
    db.session.delete(department)
    db.session.commit()
    return jsonify({'message': 'Department deleted'})

# Routes for Finance
@app.route('/finances', methods=['POST'])
def create_finance():
    data = request.get_json()
    if 'department_id' not in data or 'budget' not in data:
        return jsonify({'message': 'Department ID and budget are required'}), 400
    finance = Finance(department_id=data['department_id'], budget=data['budget'])
    db.session.add(finance)
    db.session.commit()
    return jsonify({'id': finance.id}), 201

@app.route('/finances', methods=['GET'])
def get_all_finances():
    finances = Finance.query.all()
    result = []
    for finance in finances:
        result.append({
            'id': finance.id,
            'department_id': finance.department_id,
            'budget': finance.budget
        })
    return jsonify(result)

@app.route('/finances/<int:finance_id>', methods=['GET'])
def get_finance(finance_id):
    finance = Finance.query.get(finance_id)
    if not finance:
        return jsonify({'message': 'Finance record not found'}), 404
    return jsonify({
        'id': finance.id,
        'department_id': finance.department_id,
        'budget': finance.budget
    })

@app.route('/finances/<int:finance_id>', methods=['PUT'])
def update_finance(finance_id):
    data = request.get_json()
    finance = Finance.query.get(finance_id)
    if not finance:
        return jsonify({'message': 'Finance record not found'}), 404
    if 'budget' in data:
        finance.budget = data['budget']
        db.session.commit()
        return jsonify({'message': 'Finance record updated'})
    return jsonify({'message': 'No data provided'}), 400

@app.route('/finances/<int:finance_id>', methods=['DELETE'])
def delete_finance(finance_id):
    finance = Finance.query.get(finance_id)
    if not finance:
        return jsonify({'message': 'Finance record not found'}), 404
    db.session.delete(finance)
    db.session.commit()
    return jsonify({'message': 'Finance record deleted'})

# ===== Indexs
@app.route('/')
def index():
    return render_template('index.html')
@app.route('/admin_page')
def admin():
    return render_template('admin.html')
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

