"""
Seed the database with default skills and their topics
"""
from app import create_app, db
from models import Skill, Topic

DEFAULT_SKILLS = [
    {
        'name': 'Python',
        'icon': '🐍',
        'description': 'Master Python programming fundamentals',
        'topics': ['Basics', 'Functions', 'OOP', 'Modules', 'Async']
    },
    {
        'name': 'SQL',
        'icon': '🗄️',
        'description': 'Learn database queries and optimization',
        'topics': ['SELECT', 'Joins', 'Aggregation', 'Indexing', 'Transactions']
    },
    {
        'name': 'Networking',
        'icon': '🌐',
        'description': 'Understand networking concepts and protocols',
        'topics': ['TCP/IP', 'DNS', 'HTTP/HTTPS', 'Sockets', 'Security']
    },
    {
        'name': 'Linux',
        'icon': '🐧',
        'description': 'Master Linux command line and administration',
        'topics': ['Commands', 'File System', 'Permissions', 'Processes', 'Scripting']
    },
    {
        'name': 'AWS',
        'icon': '☁️',
        'description': 'Learn Amazon Web Services and cloud computing',
        'topics': ['EC2', 'S3', 'Lambda', 'RDS', 'VPC']
    },
    {
        'name': 'JavaScript',
        'icon': '⚡',
        'description': 'Master JavaScript for web development',
        'topics': ['Basics', 'DOM', 'Async', 'ES6+', 'Testing']
    }
]

def seed_skills():
    """Add default skills to the database"""
    app = create_app()
    
    with app.app_context():
        # Check if skills already exist
        existing_count = Skill.query.count()
        if existing_count > 0:
            print(f"✓ Database already has {existing_count} skills. Skipping seed.")
            return
        
        try:
            for skill_data in DEFAULT_SKILLS:
                skill = Skill(
                    name=skill_data['name'],
                    icon=skill_data['icon'],
                    description=skill_data['description']
                )
                db.session.add(skill)
                db.session.flush()  # Flush to get the skill ID
                
                # Add topics
                for idx, topic_name in enumerate(skill_data['topics'], 1):
                    topic = Topic(
                        name=topic_name,
                        skill_id=skill.id,
                        order=idx
                    )
                    db.session.add(topic)
                
                print(f"✓ Added {skill_data['name']} with {len(skill_data['topics'])} topics")
            
            db.session.commit()
            print(f"\n✓ Successfully seeded {len(DEFAULT_SKILLS)} skills!")
            
        except Exception as e:
            db.session.rollback()
            print(f"✗ Error seeding skills: {e}")
            raise

if __name__ == '__main__':
    seed_skills()
