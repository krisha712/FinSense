import logging
from datetime import datetime
from dateutil.relativedelta import relativedelta
from models import User, Expense
from auth import hash_password
from data.loader import DatasetLoader
from database import SessionLocal
import os

logger = logging.getLogger(__name__)

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demo123"

# The CSV dataset ends at this month — we shift all dates so the
# latest month always aligns with the current calendar month.
CSV_LATEST_YEAR = 2024
CSV_LATEST_MONTH = 12


def _shift_date(date_str: str, months: int) -> str:
    """Shift a YYYY-MM-DD string forward by `months` months."""
    try:
        return (datetime.strptime(date_str, "%Y-%m-%d") + relativedelta(months=months)).strftime("%Y-%m-%d")
    except Exception:
        return date_str


def init_demo_data():
    """Create demo@example.com with the budgetwise CSV dataset if it doesn't exist.
    All dates are shifted so the latest month matches the current month.
    """
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == DEMO_EMAIL).first()

        if demo_user:
            count = db.query(Expense).filter(Expense.user_id == demo_user.id).count()
            logger.info(f"Demo user already exists: {DEMO_EMAIL} ({count} expenses)")
            return

        # Create user
        demo_user = User(
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD)
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        logger.info(f"Created demo user: {DEMO_EMAIL}")

        # Load CSV
        dataset_path = os.getenv("DATASET_PATH", "./data/budgetwise.csv")
        loader = DatasetLoader(dataset_path)
        df_expenses, _ = loader.load_and_preprocess()
        logger.info(f"Loaded {len(df_expenses)} expenses from dataset")

        # Calculate month offset so latest CSV month == current month
        now = datetime.now()
        offset = (now.year - CSV_LATEST_YEAR) * 12 + (now.month - CSV_LATEST_MONTH)
        logger.info(f"Shifting demo dates by {offset} months to align with {now.strftime('%B %Y')}")

        expenses_to_add = [
            Expense(
                user_id=demo_user.id,
                date=_shift_date(str(row["date"]), offset),
                amount=float(row["amount"]),
                category=str(row["category"]),
                description=str(row["description"]),
                source="csv",
            )
            for _, row in df_expenses.iterrows()
        ]
        db.bulk_save_objects(expenses_to_add)
        db.commit()
        logger.info(f"Inserted {len(expenses_to_add)} demo expenses")

    except Exception as e:
        logger.error(f"Error initialising demo data: {e}")
        db.rollback()
        raise
    finally:
        db.close()
