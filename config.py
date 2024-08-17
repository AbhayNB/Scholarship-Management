class Config:
    SECRET_KEY = 'super-secret-key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///pre.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'jwt-secret-string'
    UPLOAD_FOLDER='uploads/'
    ALLOWED_EXTENSIONS={'pdf'}

class LocalDevelopmentConfig(Config):
    DEBUG = True
