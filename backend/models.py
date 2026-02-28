from datetime import datetime, timezone
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
import json

def get_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    timezone = db.Column(db.String(50), default='UTC')
    is_pro = db.Column(db.Boolean, default=False)
    stripe_customer_id = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    goals = db.relationship('UserGoal', backref='user', lazy=True, cascade='all, delete-orphan')
    logs = db.relationship('DailyLog', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'timezone': self.timezone,
            'is_pro': self.is_pro,
            'created_at': self.created_at.isoformat()
        }

class UserGoal(db.Model):
    __tablename__ = 'user_goals'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    topic = db.Column(db.String(50), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False, default='beginner')
    daily_question_target = db.Column(db.Integer, default=5)

    def to_dict(self):
        return {
            'id': self.id,
            'topic': self.topic,
            'difficulty': self.difficulty,
            'daily_question_target': self.daily_question_target
        }

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    topic = db.Column(db.String(50), nullable=False, index=True)
    difficulty = db.Column(db.String(20), nullable=False, index=True)
    question_text = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=False) # e.g. {"A": "ans1", "B": "ans2"}
    correct_option = db.Column(db.String(10), nullable=False) # 'A', 'B', etc.
    explanation = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        # We don't send correct_option and explanation directly to the user when playing
        return {
            'id': self.id,
            'topic': self.topic,
            'difficulty': self.difficulty,
            'question_text': self.question_text,
            'options': self.options
        }

class DailyLog(db.Model):
    __tablename__ = 'daily_logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    questions_attempted = db.Column(db.Integer, default=0)
    questions_correct = db.Column(db.Integer, default=0)
    streak_maintained = db.Column(db.Boolean, default=False)
    
    __table_args__ = (
        db.Index('idx_user_date', 'user_id', 'date'),  # Composite index for common queries
    )
    
    def to_dict(self):
        return {
            'date': self.date.isoformat(),
            'questions_attempted': self.questions_attempted,
            'questions_correct': self.questions_correct,
            'streak_maintained': self.streak_maintained
        }

class Habit(db.Model):
    __tablename__ = 'habits'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    frequency = db.Column(db.String(20), default='daily')  # daily, weekly
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    logs = db.relationship('HabitLog', backref='habit', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'frequency': self.frequency,
            'created_at': self.created_at.isoformat()
        }

class HabitLog(db.Model):
    __tablename__ = 'habit_logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)
    completed = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'habit_id': self.habit_id,
            'date': self.date.isoformat(),
            'completed': self.completed
        }

class Skill(db.Model):
    __tablename__ = 'skills'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    icon = db.Column(db.String(50), default='BookOpen')
    description = db.Column(db.Text, nullable=True)

    topics = db.relationship('Topic', backref='skill', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'icon': self.icon,
            'description': self.description,
            'topics': [t.to_dict() for t in self.topics]
        }

class Topic(db.Model):
    __tablename__ = 'topics'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'skill_id': self.skill_id,
            'name': self.name,
            'description': self.description,
            'order': self.order
        }

class UserSkillProgress(db.Model):
    __tablename__ = 'user_skill_progress'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id'), nullable=False, index=True)
    completion_pct = db.Column(db.Float, default=0.0)
    topics_done = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'skill_id': self.skill_id,
            'completion_pct': self.completion_pct,
            'topics_done': self.topics_done
        }

class UserAttempt(db.Model):
    __tablename__ = 'user_attempts'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False, index=True)
    is_correct = db.Column(db.Boolean, default=False)
    time_taken = db.Column(db.Integer, default=0)  # seconds
    attempted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'is_correct': self.is_correct,
            'time_taken': self.time_taken,
            'attempted_at': self.attempted_at.isoformat()
        }
