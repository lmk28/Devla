from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS  # Importieren Sie CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'devla/public/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///devla.db'
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
db = SQLAlchemy(app)

# Datenbankmodelle
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    difficulty = db.Column(db.String(50), nullable=False)
    image = db.Column(db.String(255))  # URL oder Pfad zum Bild

class Module(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    video = db.Column(db.String(255))  # URL oder Pfad zum Video
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(username=data['username'], email=data['email'], password=hashed_password, is_admin=data.get('is_admin', False))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password, data['password']):
        token = jwt.encode({'user_id': user.id, 'is_admin': user.is_admin, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({'token': token, 'is_admin': user.is_admin})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/create_admin', methods=['POST'])
def create_admin():
    data = request.get_json()
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing!'}), 403

    try:
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        if not decoded_token['is_admin']:
            return jsonify({'message': 'Access denied!'}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired!'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token!'}), 403

    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_admin = User(username=data['username'], email=data['email'], password=hashed_password, is_admin=True)
    db.session.add(new_admin)
    db.session.commit()
    return jsonify({'message': 'Admin user created successfully'}), 201

@app.route('/add_course', methods=['POST'])
def add_course():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing!'}), 403

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        if not data['is_admin']:
            return jsonify({'message': 'Access denied!'}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired!'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token!'}), 403

    data = request.get_json()
    new_course = Course(
        title=data['title'],
        description=data['description'],
        difficulty=data['difficulty'],
        image=data.get('image', '')
    )
    db.session.add(new_course)
    db.session.flush()  # Dies gibt dem neuen Kurs eine ID

    # Module hinzufügen
    for module_data in data.get('modules', []):
        new_module = Module(
            title=module_data['title'],
            content=module_data['content'],
            course_id=new_course.id
        )
        db.session.add(new_module)

    db.session.commit()
    return jsonify({'message': 'Course added successfully!'}), 201
        
@app.route('/courses', methods=['GET'])
def get_courses():
    try:
        courses = Course.query.all()
        return jsonify([{
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'difficulty': course.difficulty,
            'image': course.image,
            'modules': [{'title': module.title, 'content': module.content, 'video': module.video} for module in Module.query.filter_by(course_id=course.id).all()]  # Module hinzufügen
        } for course in courses]), 200
    except Exception:
        print("Error fetching courses: undefined")  # Server-seitiges Logging
        return jsonify({'error': 'undefined'}), 500

@app.route('/add_course', methods=['POST'], endpoint='add_course_new')
def add_course():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing!'}), 403

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        if not data['is_admin']:
            return jsonify({'message': 'Access denied!'}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired!'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token!'}), 403

    data = request.get_json()
    new_course = Course(
        title=data['title'],
        description=data['description'],
        difficulty=data['difficulty'],
        image=data.get('image', '')
    )
    db.session.add(new_course)
    db.session.flush()  # Dies gibt dem neuen Kurs eine ID

    # Module hinzufügen
    for module_data in data.get('modules', []):
        new_module = Module(
            title=module_data['title'],
            content=module_data['content'],
            course_id=new_course.id
        )
        db.session.add(new_module)

    db.session.commit()
    return jsonify({'message': 'Course added successfully!'}), 201

@app.route('/delete_course/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing!'}), 403

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        if not data['is_admin']:
            return jsonify({'message': 'Access denied!'}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired!'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token!'}), 403

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'message': 'Course not found!'}), 404

    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course deleted successfully!'}), 200

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload_image/<string:course_id>', methods=['POST'])
def upload_image(course_id):
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        return jsonify({'image_url': f'/uploads/{filename}'}), 200
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/update_course/<int:course_id>', methods=['POST'])
def update_course(course_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing!'}), 403

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        if not data['is_admin']:
            return jsonify({'message': 'Access denied!'}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired!'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token!'}), 403

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'message': 'Course not found!'}), 404

    data = request.get_json()
    course.title = data.get('title', course.title)
    course.description = data.get('description', course.description)
    course.difficulty = data.get('difficulty', course.difficulty)
    course.image = data.get('image', course.image)  # Update image if provided

    # Vorhandene Module löschen
    Module.query.filter_by(course_id=course.id).delete()

    # Neue Module hinzufügen
    for module_data in data.get('modules', []):
        new_module = Module(
            title=module_data['title'],
            content=module_data['content'],
            video=module_data.get('video', ''),  # Video-URL hinzufügen
            course_id=course.id
        )
        db.session.add(new_module)

    db.session.commit()
    return jsonify({'message': 'Course updated successfully!'}), 200

@app.route('/add_module/<int:course_id>', methods=['POST'])
def add_module(course_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing!'}), 403

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        if not data['is_admin']:
            return jsonify({'message': 'Access denied!'}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired!'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token!'}), 403

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'message': 'Course not found!'}), 404

    data = request.get_json()
    new_module = Module(
        title=data['title'],
        content=data['content'],
        video=data.get('video', ''),  # Video-URL hinzufügen
        course_id=course.id
    )
    db.session.add(new_module)
    db.session.commit()
    return jsonify({'message': 'Module added successfully!'}), 201

@app.route('/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'message': 'Course not found!'}), 404

    return jsonify({
        'id': course.id,
        'title': course.title,
        'description': course.description,
        'difficulty': course.difficulty,
        'image': course.image,
        'modules': [{'title': module.title, 'content': module.content, 'video': module.video} for module in Module.query.filter_by(course_id=course.id).all()]
    }), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)