from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_compress import Compress
from functools import lru_cache
from config import Config

db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    CORS(app, 
         resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}},
         allow_headers=["Content-Type", "Authorization"],
         expose_headers=["Content-Type"],
         supports_credentials=True)
    Compress(app)  # Enable GZIP compression
    db.init_app(app)
    
    # Register blueprints (routes will be added here later)
    with app.app_context():
        try:
            import models  # Create tables if not exist
            db.create_all()
        except Exception as e:
            print(f"Warning: Database error: {e}")
        
        from routes import api_bp
        app.register_blueprint(api_bp, url_prefix='/api/v1')
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000, host='0.0.0.0')
