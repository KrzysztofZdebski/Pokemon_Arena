from datetime import datetime, timedelta, timezone
from flask import jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, set_refresh_cookies, unset_refresh_cookies
from app.db.models import TokenBlocklist, User


class AuthController:
    def add_to_blocklist(self, jti):
        from app.db.db import db
        now = datetime.now(timezone(timedelta(hours=2)))
        db.session.add(TokenBlocklist(jti=jti, created_at=now))
        db.session.commit()
    
    def login(self, request):
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message':'Missing required fields!'}), 400
        user = User.get_by_username(username=username)
        if user is None:
            return jsonify({'message':'User not found!'}), 404
        if not user.check_password(password):
            return jsonify({'message':'Invalid password!'}), 401
        
        access_token = create_access_token(identity=user)
        refresh_token = create_refresh_token(identity=user)

        response = jsonify(access_token=access_token, message='Login successful!')   
        set_refresh_cookies(response, refresh_token)
        return response, 200
    
    def login_get(self, user):
        if user is None:
            return jsonify({'message':'User not found!'}), 404
        
        user_data = {
            'username': user.username,
            'email': user.email,
        }
        return jsonify(user_data), 200


    def register(self, request):
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        if not username or not password or not email:
            return jsonify({'message':'Missing required fields!'}), 400

        user = User.get_by_username(username=username)
        if user is not None:
            return jsonify({'message':'User already exists!'}), 409
        
        user = User(username=username, email=email)
        user.set_password(password)
        user.save()

        return jsonify({'message':'User registered successfully!'}), 201
    
    def logout(self, jti, access):
        self.add_to_blocklist(jti)
        response = jsonify({"msg": "logout successful"})
        if not access:
            unset_refresh_cookies(response)
        return response, 200

    def refresh(self, token, user):
        self.add_to_blocklist(token["jti"])
        access_token = create_access_token(identity=user)
        refresh_token = create_refresh_token(identity=user)
        response = jsonify(access_token=access_token, message='Token refreshed successfully!')
        set_refresh_cookies(response, refresh_token)
        return response, 200
    
    