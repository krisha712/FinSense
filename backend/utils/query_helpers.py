from sqlalchemy.orm import Session
from sqlalchemy import extract
from models import Expense, User
from typing import Optional, List
import pandas as pd


def get_filtered_expenses(
    db: Session,
    user: User,
    month: Optional[int] = None,
    year: Optional[int] = None,
    category: Optional[str] = None
) -> List[Expense]:
    """Return expenses belonging exclusively to the authenticated user."""
    query = db.query(Expense).filter(Expense.user_id == user.id)

    if year is not None:
        query = query.filter(extract('year', Expense.date) == year)
    if month is not None:
        query = query.filter(extract('month', Expense.date) == month)
    if category:
        query = query.filter(Expense.category.ilike(category))

    return query.all()

def expenses_to_dataframe(expenses: List[Expense]) -> pd.DataFrame:
    if not expenses:
        return pd.DataFrame(columns=['id', 'date', 'amount', 'category', 'description'])
    
    data = [{
        'id': e.id,
        'date': e.date,
        'amount': e.amount,
        'category': e.category,
        'description': e.description,
        'user_id': e.user_id,
        'source': e.source
    } for e in expenses]
    
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    return df
