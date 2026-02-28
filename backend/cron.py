import os
from apscheduler.schedulers.blocking import BlockingScheduler
from datetime import datetime, timezone, timedelta
import smtplib
from email.message import EmailMessage
from app import create_app, db
from models import User, DailyLog

# Create the scheduler
scheduler = BlockingScheduler()

# Function to Mock sending an email
def send_reminder_email(user_email, streak, topic):
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] --- MOCK EMAIL SENT ---")
    print(f"To: {user_email}")
    print(f"Subject: Don't lose your {streak} day streak! 🔥")
    print(f"Body: Hey! You haven't done your {topic} sprint today. Hop into SkillSprint now to keep your habit alive!")
    print(f"-----------------------------------------\n")
    # For a production MVP you would use:
    # msg = EmailMessage()
    # msg.set_content(...)
    # with smtplib.SMTP_SSL('smtp.sendgrid.net', 465) as smtp:
    #     smtp.login('apikey', os.environ.get('SENDGRID_API_KEY'))
    #     smtp.send_message(msg)

def check_daily_habits():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Running daily habit check...")
    
    # We must run this within a Flask application context to access the database
    app = create_app()
    with app.app_context():
        # Find time relative to right now. In a real app, this runs at specific local times per user.
        today = datetime.now(timezone.utc).date()
        
        users = User.query.all()
        for user in users:
            # Skip users with no goals set
            if not user.goals:
                continue
                
            active_topic = user.goals[0].topic
            
            # Did they practice today?
            log = DailyLog.query.filter_by(user_id=user.id, date=today).first()
            if not log or not log.streak_maintained:
                # User hasn't maintained streak today, send reminder!
                send_reminder_email(user.email, user.current_streak, active_topic)

# Schedule the job to run every day at 6:00 PM (18:00)
# For the sake of this testing environment, we'll configure it to run every 1 minute if you uncomment the second line
scheduler.add_job(check_daily_habits, 'cron', hour=18, minute=0)
# scheduler.add_job(check_daily_habits, 'interval', minutes=1)

if __name__ == '__main__':
    print("SkillSprint Cron Job Scheduler Started. Press Ctrl+C to exit.")
    print("It will scan for users who missed their daily practice and send emails.")
    # Run a test check immediately on boot
    check_daily_habits()
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass
