from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity


def role_required(role):
    def wrapper(fn):
        @jwt_required()
        def decorated_view(*args, **kwargs):
            current_user = get_jwt_identity()
            if role not in current_user['roles']:
                return jsonify({"message": "Access denied"}), 403
            return fn(*args, **kwargs)
        return decorated_view
    return wrapper