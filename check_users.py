"""Check existing users in the database."""
from sqlmodel import Session, select, create_engine
from server.src.user_models import User

engine = create_engine('sqlite:///./data.db')
with Session(engine) as session:
    users = session.exec(select(User)).all()
    print(f'Found {len(users)} users:')
    for u in users:
        print(f'  - {u.username} ({u.email})')
