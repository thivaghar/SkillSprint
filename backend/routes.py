from flask import Blueprint, jsonify, request
from models import db, User, UserGoal, Question, DailyLog, Habit, HabitLog, Skill, Topic, UserSkillProgress, UserAttempt
from question_bank import get_builtin_questions
import jwt
from datetime import datetime, timedelta, timezone
from config import Config
import google.generativeai as genai
import json
import stripe
from functools import wraps

api_bp = Blueprint('api', __name__)

# Simple in-memory cache for dashboard stats (TTL: 5 minutes)
_stats_cache = {}

def cache_stats(timeout=300):
    """Simple cache decorator for expensive operations (user-specific)"""
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            cache_key = f"stats_{current_user.id}"
            now = datetime.now(timezone.utc).timestamp()
            
            if cache_key in _stats_cache:
                cached_data, timestamp = _stats_cache[cache_key]
                if now - timestamp < timeout:
                    return cached_data
            
            result = f(current_user, *args, **kwargs)
            _stats_cache[cache_key] = (result, now)
            return result
        return decorated_function
    return decorator

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "SkillSprint API is running"}), 200

from functools import wraps

# --- AUTH MIDDLEWARE ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

# --- AUTH ROUTES ---
@api_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists'}), 400

    new_user = User(email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'Registered successfully', 'user': new_user.to_dict()}), 201

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Could not verify'}), 401

    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Login failed!'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }, Config.JWT_SECRET_KEY, algorithm="HS256")

    return jsonify({'token': token, 'user': user.to_dict()}), 200

# --- USER ROUTES ---
@api_bp.route('/users/me', methods=['GET'])
@token_required
def get_me(current_user):
    goals = [g.to_dict() for g in current_user.goals]
    return jsonify({'user': current_user.to_dict(), 'goals': goals}), 200

@api_bp.route('/users/goals', methods=['POST', 'PUT'])
@token_required
def set_goal(current_user):
    data = request.get_json()
    if not data or not data.get('topic') or not data.get('difficulty'):
        return jsonify({'message': 'Missing topic or difficulty'}), 400
        
    # Check if goal exists for simplicity MVP assumes 1 goal
    goal = UserGoal.query.filter_by(user_id=current_user.id).first()
    if goal:
        goal.topic = data['topic']
        goal.difficulty = data['difficulty']
        if 'question_count' in data:
            goal.daily_question_target = data['question_count']
    else:
        question_count = data.get('question_count', 5)
        goal = UserGoal(user_id=current_user.id, topic=data['topic'], difficulty=data['difficulty'], daily_question_target=question_count)
        db.session.add(goal)
        
    db.session.commit()
    return jsonify({'message': 'Goal updated', 'goal': goal.to_dict()}), 200

# --- PRACTICE ROUTES ---
def generate_gemini_questions(topic, difficulty, count):
    if not Config.GEMINI_API_KEY or Config.GEMINI_API_KEY == 'your_api_key_here':
        print("No GEMINI_API_KEY configured.")
        return []
        
    genai.configure(api_key=Config.GEMINI_API_KEY)
    
    prompt = f"""Generate {count} multiple choice questions about {topic} at a {difficulty} level.
Return ONLY a raw JSON array of objects. No markdown formatting, no code blocks, just the JSON.
Each object must have exactly these keys:
- "question_text": The question string
- "options": An object with exactly 4 string keys "A", "B", "C", "D" mapping to the 4 choices
- "correct_option": A string "A", "B", "C", or "D"
- "explanation": A brief string explaining why the answer is correct
"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith('```json'): text = text[7:]
        if text.startswith('```'): text = text[3:]
        if text.endswith('```'): text = text[:-3]
            
        q_data = json.loads(text.strip())
        
        new_questions = []
        for q in q_data:
            new_q = Question(
                topic=topic,
                difficulty=difficulty,
                question_text=q['question_text'],
                options=q['options'],
                correct_option=q['correct_option'],
                explanation=q['explanation']
            )
            db.session.add(new_q)
            new_questions.append(new_q)
            
        db.session.commit()
        return new_questions
    except Exception as e:
        print(f"Gemini generation failed: {e}")
        return []

@api_bp.route('/practice/daily', methods=['GET'])
@token_required
def get_daily_practice(current_user):
    goal = UserGoal.query.filter_by(user_id=current_user.id).first()
    if not goal:
        return jsonify({'message': 'Please set a learning goal first'}), 400
        
    target_count = goal.daily_question_target
    questions = Question.query.filter_by(topic=goal.topic, difficulty=goal.difficulty).order_by(db.func.random()).limit(target_count).all()
    
    # If we don't have enough questions, generate them with Gemini!
    if len(questions) < target_count:
        needed = target_count - len(questions)
        print(f"Generating {needed} more questions using Gemini...")
        generated = generate_gemini_questions(goal.topic, goal.difficulty, needed)
        # If generation succeeded, add them to our current pool
        if generated:
            questions.extend(generated)
    
    # Final fallback if Gemini also failed or key not set
    if not questions:
        questions = Question.query.order_by(db.func.random()).limit(5).all()
        
    return jsonify({'questions': [q.to_dict() for q in questions]}), 200

@api_bp.route('/practice/generate', methods=['POST'])
@token_required
def generate_practice(current_user):
    """Generate questions: tries DB → Gemini → built-in bank (always works)."""
    data = request.get_json()
    topic = data.get('topic', 'Python')
    difficulty = data.get('difficulty', 'beginner')
    count = min(data.get('count', 5), 10)
    
    # 1. Try existing DB questions
    existing = Question.query.filter_by(topic=topic, difficulty=difficulty).order_by(db.func.random()).limit(count).all()
    if len(existing) >= count:
        return jsonify({'questions': [q.to_dict() for q in existing]}), 200
    
    # 2. Try Gemini API
    generated = generate_gemini_questions(topic, difficulty, count)
    if generated:
        return jsonify({'questions': [q.to_dict() for q in generated]}), 200
    
    # 3. Fallback: built-in question bank (no API needed)
    builtin = get_builtin_questions(topic, difficulty, count)
    if builtin:
        # Save to DB for future use
        saved = []
        for q in builtin:
            new_q = Question(
                topic=q['topic'], difficulty=q['difficulty'],
                question_text=q['question_text'], options=q['options'],
                correct_option=q['correct_option'], explanation=q['explanation']
            )
            db.session.add(new_q)
            saved.append(new_q)
        db.session.commit()
        return jsonify({'questions': [q.to_dict() for q in saved]}), 200
    
    # 4. Any existing in DB at all
    if existing:
        return jsonify({'questions': [q.to_dict() for q in existing]}), 200
    
    return jsonify({'message': f'No questions available for {topic}/{difficulty}.', 'questions': []}), 200

@api_bp.route('/practice/submit', methods=['POST'])
@token_required
def submit_practice(current_user):
    data = request.get_json()
    answers = data.get('answers', []) # [{'question_id': 1, 'selected_option': 'A'}]
    
    if not answers:
        return jsonify({'message': 'No answers submitted'}), 400
        
    correct_count = 0
    results = []
    
    for ans in answers:
        q = Question.query.get(ans['question_id'])
        if q:
            is_correct = ans['selected_option'] == q.correct_option
            if is_correct: correct_count += 1
            results.append({
                'question_id': q.id,
                'is_correct': is_correct,
                'correct_option': q.correct_option,
                'explanation': q.explanation
            })
            # Record individual attempt
            attempt = UserAttempt(
                user_id=current_user.id,
                question_id=q.id,
                is_correct=is_correct,
                time_taken=ans.get('time_taken', 0)
            )
            db.session.add(attempt)
            
    # Update Daily Log
    today = datetime.now(timezone.utc).date()
    log = DailyLog.query.filter_by(user_id=current_user.id, date=today).first()
    
    goal = UserGoal.query.filter_by(user_id=current_user.id).first()
    target = goal.daily_question_target if goal else 5
    
    if not log:
        log = DailyLog(user_id=current_user.id, date=today, questions_attempted=0, questions_correct=0, streak_maintained=False)
        db.session.add(log)
        
    log.questions_attempted += len(answers)
    log.questions_correct += correct_count
    
    streak_was_maintained = log.streak_maintained
    if log.questions_attempted >= target:
        log.streak_maintained = True
        
    # Update user streak if this submission newly achieved the daily goal
    if not streak_was_maintained and log.streak_maintained:
        current_user.current_streak += 1
        if current_user.current_streak > current_user.longest_streak:
            current_user.longest_streak = current_user.current_streak
            
    db.session.commit()
    
    return jsonify({
        'score': f"{correct_count}/{len(answers)}",
        'streak_maintained': log.streak_maintained,
        'current_streak': current_user.current_streak,
        'results': results
    }), 200

# --- DASHBOARD ROUTES ---
@api_bp.route('/dashboard/stats', methods=['GET'])
@token_required
@cache_stats(timeout=300)  # Cache for 5 minutes
def get_dashboard_stats(current_user):
    thirty_days_ago = datetime.now(timezone.utc).date() - timedelta(days=30)
    logs = DailyLog.query.filter(
        DailyLog.user_id == current_user.id, 
        DailyLog.date >= thirty_days_ago
    ).order_by(DailyLog.date).all()
    
    heatmap = {}
    total_attempted = 0
    total_correct = 0
    
    for log in logs:
        heatmap[log.date.isoformat()] = 1 if log.streak_maintained else 0
        total_attempted += log.questions_attempted
        total_correct += log.questions_correct
        
    accuracy = round((total_correct / total_attempted * 100), 1) if total_attempted > 0 else 0
    
    # Weekly breakdown for chart
    weekly = []
    for i in range(7):
        day = datetime.now(timezone.utc).date() - timedelta(days=6 - i)
        day_log = next((l for l in logs if l.date == day), None)
        weekly.append({
            'day': day.strftime('%a'),
            'date': day.isoformat(),
            'attempted': day_log.questions_attempted if day_log else 0,
            'correct': day_log.questions_correct if day_log else 0,
        })
    
    return jsonify({
        'current_streak': current_user.current_streak,
        'longest_streak': current_user.longest_streak,
        'accuracy': accuracy,
        'heatmap': heatmap,
        'weekly': weekly,
        'is_pro': current_user.is_pro
    }), 200

# --- PAYMENTS ROUTES (STRIPE) ---
stripe.api_key = Config.STRIPE_SECRET_KEY

@api_bp.route('/payments/create-checkout-session', methods=['POST'])
@token_required
def create_checkout_session(current_user):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'SkillSprint Pro Subscription',
                        'description': 'Unlimited daily practice and advanced AI insights.',
                    },
                    'unit_amount': 499, # $4.99
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url='http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:5173/dashboard',
            client_reference_id=current_user.id # To know which user upgraded
        )
        return jsonify({'id': session.id, 'url': session.url}), 200
    except Exception as e:
        return jsonify(error=str(e)), 403

@api_bp.route('/payments/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    event = None
    try:
        event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    except ValueError as e:
        return jsonify(error=str(e)), 400

    # Handle the checkout.session.completed event
    if event.type == 'checkout.session.completed':
        session = event.data.object
        user_id = session.client_reference_id
        if user_id:
            user = User.query.get(user_id)
            if user:
                user.is_pro = True
                user.stripe_customer_id = session.customer
                db.session.commit()
                print(f"User {user.email} upgraded to PRO!")

    return jsonify(success=True), 200

# --- HABIT ROUTES ---
@api_bp.route('/habits', methods=['GET'])
@token_required
def get_habits(current_user):
    habits = Habit.query.filter_by(user_id=current_user.id).all()
    result = []
    today = datetime.now(timezone.utc).date()
    for h in habits:
        hd = h.to_dict()
        # Check if done today
        today_log = HabitLog.query.filter_by(habit_id=h.id, user_id=current_user.id, date=today).first()
        hd['done_today'] = today_log is not None and today_log.completed
        # Streak calculation
        streak = 0
        check_date = today
        while True:
            log = HabitLog.query.filter_by(habit_id=h.id, user_id=current_user.id, date=check_date, completed=True).first()
            if log:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        hd['streak'] = streak
        result.append(hd)
    return jsonify({'habits': result}), 200

@api_bp.route('/habits', methods=['POST'])
@token_required
def create_habit(current_user):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'Missing habit name'}), 400
    habit = Habit(
        user_id=current_user.id,
        name=data['name'],
        frequency=data.get('frequency', 'daily')
    )
    db.session.add(habit)
    db.session.commit()
    return jsonify({'habit': habit.to_dict()}), 201

@api_bp.route('/habits/<int:habit_id>', methods=['PUT'])
@token_required
def update_habit(current_user, habit_id):
    habit = Habit.query.filter_by(id=habit_id, user_id=current_user.id).first()
    if not habit:
        return jsonify({'message': 'Habit not found'}), 404
    data = request.get_json()
    if data.get('name'):
        habit.name = data['name']
    if data.get('frequency'):
        habit.frequency = data['frequency']
    db.session.commit()
    return jsonify({'habit': habit.to_dict()}), 200

@api_bp.route('/habits/<int:habit_id>', methods=['DELETE'])
@token_required
def delete_habit(current_user, habit_id):
    habit = Habit.query.filter_by(id=habit_id, user_id=current_user.id).first()
    if not habit:
        return jsonify({'message': 'Habit not found'}), 404
    db.session.delete(habit)
    db.session.commit()
    return jsonify({'message': 'Habit deleted'}), 200

@api_bp.route('/habits/<int:habit_id>/log', methods=['POST'])
@token_required
def log_habit(current_user, habit_id):
    habit = Habit.query.filter_by(id=habit_id, user_id=current_user.id).first()
    if not habit:
        return jsonify({'message': 'Habit not found'}), 404
    today = datetime.now(timezone.utc).date()
    existing = HabitLog.query.filter_by(habit_id=habit_id, user_id=current_user.id, date=today).first()
    if existing:
        # Toggle off
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'message': 'Habit unchecked', 'completed': False}), 200
    log = HabitLog(habit_id=habit_id, user_id=current_user.id, date=today, completed=True)
    db.session.add(log)
    db.session.commit()
    return jsonify({'message': 'Habit logged', 'completed': True}), 200

@api_bp.route('/habits/heatmap', methods=['GET'])
@token_required
def habit_heatmap(current_user):
    # Last 365 days of habit completions across all habits
    start_date = datetime.now(timezone.utc).date() - timedelta(days=365)
    logs = HabitLog.query.filter(
        HabitLog.user_id == current_user.id,
        HabitLog.date >= start_date,
        HabitLog.completed == True
    ).all()
    heatmap = {}
    for log in logs:
        ds = log.date.isoformat()
        heatmap[ds] = heatmap.get(ds, 0) + 1
    return jsonify({'heatmap': heatmap}), 200

# --- SKILL ROUTES ---
@api_bp.route('/skills', methods=['GET'])
@token_required
def get_skills(current_user):
    skills = Skill.query.all()
    result = []
    for s in skills:
        sd = s.to_dict()
        progress = UserSkillProgress.query.filter_by(user_id=current_user.id, skill_id=s.id).first()
        sd['progress'] = progress.to_dict() if progress else {'completion_pct': 0, 'topics_done': 0}
        result.append(sd)
    return jsonify({'skills': result}), 200

@api_bp.route('/skills', methods=['POST'])
@token_required
def create_skill(current_user):
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'message': 'Skill name is required'}), 400
    
    # Check for duplicates (case-insensitive)
    existing = Skill.query.filter(db.func.lower(Skill.name) == name.lower()).first()
    if existing:
        return jsonify({'message': 'Skill already exists', 'skill': existing.to_dict()}), 200
    
    skill = Skill(
        name=name,
        icon=data.get('icon', '📚'),
        description=data.get('description', '')
    )
    db.session.add(skill)
    db.session.commit()
    
    # If topics were provided, add them
    topics = data.get('topics', [])
    for i, t in enumerate(topics):
        topic_name = t if isinstance(t, str) else t.get('name', '')
        if topic_name.strip():
            topic = Topic(skill_id=skill.id, name=topic_name.strip(), order=i + 1)
            db.session.add(topic)
    db.session.commit()
    
    return jsonify({'skill': skill.to_dict()}), 201

@api_bp.route('/skills/<int:skill_id>', methods=['DELETE'])
@token_required
def delete_skill(current_user, skill_id):
    skill = Skill.query.get(skill_id)
    if not skill:
        return jsonify({'message': 'Skill not found'}), 404
    # Delete related topics and progress
    Topic.query.filter_by(skill_id=skill_id).delete()
    UserSkillProgress.query.filter_by(skill_id=skill_id).delete()
    db.session.delete(skill)
    db.session.commit()
    return jsonify({'message': 'Skill deleted'}), 200

@api_bp.route('/skills/<int:skill_id>/topics', methods=['POST'])
@token_required
def add_topic(current_user, skill_id):
    skill = Skill.query.get(skill_id)
    if not skill:
        return jsonify({'message': 'Skill not found'}), 404
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'message': 'Topic name is required'}), 400
    max_order = db.session.query(db.func.max(Topic.order)).filter_by(skill_id=skill_id).scalar() or 0
    topic = Topic(skill_id=skill_id, name=name, description=data.get('description', ''), order=max_order + 1)
    db.session.add(topic)
    db.session.commit()
    return jsonify({'topic': topic.to_dict()}), 201

@api_bp.route('/skills/<int:skill_id>/progress', methods=['GET'])
@token_required
def get_skill_progress(current_user, skill_id):
    skill = Skill.query.get(skill_id)
    if not skill:
        return jsonify({'message': 'Skill not found'}), 404
    progress = UserSkillProgress.query.filter_by(user_id=current_user.id, skill_id=skill_id).first()
    return jsonify({
        'skill': skill.to_dict(),
        'progress': progress.to_dict() if progress else {'completion_pct': 0, 'topics_done': 0}
    }), 200

@api_bp.route('/skills/<int:skill_id>/progress', methods=['PUT'])
@token_required
def update_skill_progress(current_user, skill_id):
    data = request.get_json()
    progress = UserSkillProgress.query.filter_by(user_id=current_user.id, skill_id=skill_id).first()
    if not progress:
        progress = UserSkillProgress(user_id=current_user.id, skill_id=skill_id)
        db.session.add(progress)
    if 'completion_pct' in data:
        progress.completion_pct = data['completion_pct']
    if 'topics_done' in data:
        progress.topics_done = data['topics_done']
    db.session.commit()
    return jsonify({'progress': progress.to_dict()}), 200

# --- ANALYTICS ROUTES ---
@api_bp.route('/analytics/summary', methods=['GET'])
@token_required
def analytics_summary(current_user):
    thirty_days_ago = datetime.now(timezone.utc).date() - timedelta(days=30)
    logs = DailyLog.query.filter(DailyLog.user_id == current_user.id, DailyLog.date >= thirty_days_ago).order_by(DailyLog.date).all()
    
    total_attempted = sum(l.questions_attempted for l in logs)
    total_correct = sum(l.questions_correct for l in logs)
    accuracy = round((total_correct / total_attempted * 100), 1) if total_attempted > 0 else 0
    active_days = len([l for l in logs if l.streak_maintained])
    
    # Weekly breakdown (last 4 weeks)
    weekly_data = []
    for week in range(4):
        week_start = datetime.now(timezone.utc).date() - timedelta(days=(3 - week) * 7 + 6)
        week_end = week_start + timedelta(days=6)
        week_logs = [l for l in logs if week_start <= l.date <= week_end]
        wa = sum(l.questions_attempted for l in week_logs)
        wc = sum(l.questions_correct for l in week_logs)
        weekly_data.append({
            'week': f'W{week + 1}',
            'start': week_start.isoformat(),
            'attempted': wa,
            'correct': wc,
            'accuracy': round((wc / wa * 100), 1) if wa > 0 else 0
        })
    
    # Daily trend (last 14 days)
    daily_trend = []
    for i in range(14):
        day = datetime.now(timezone.utc).date() - timedelta(days=13 - i)
        day_log = next((l for l in logs if l.date == day), None)
        daily_trend.append({
            'date': day.isoformat(),
            'day': day.strftime('%d %b'),
            'attempted': day_log.questions_attempted if day_log else 0,
            'correct': day_log.questions_correct if day_log else 0,
            'accuracy': round((day_log.questions_correct / day_log.questions_attempted * 100), 1) if day_log and day_log.questions_attempted > 0 else 0
        })
    
    # Productivity score (0-100): weighted combo of streak, accuracy, consistency
    streak_score = min(current_user.current_streak * 5, 40)  # max 40
    accuracy_score = accuracy * 0.4  # max 40
    consistency_score = min(active_days * 2, 20)  # max 20
    productivity = round(streak_score + accuracy_score + consistency_score, 1)
    
    return jsonify({
        'total_attempted': total_attempted,
        'total_correct': total_correct,
        'accuracy': accuracy,
        'active_days': active_days,
        'current_streak': current_user.current_streak,
        'longest_streak': current_user.longest_streak,
        'productivity_score': min(productivity, 100),
        'weekly': weekly_data,
        'daily_trend': daily_trend
    }), 200
