from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User, MonthlyBudget, Expense
from middleware import get_current_user
from datetime import datetime
from typing import Optional
from sqlalchemy import func

router = APIRouter(prefix="/api/rolling-budget", tags=["rolling-budget"])


class SetBudgetPayload(BaseModel):
    month: int
    year: int
    budget_amount: float


def get_month_spent(db: Session, user_id: str, month: int, year: int) -> float:
    """Sum all expenses for a user in a given month/year."""
    prefix = f"{year}-{str(month).zfill(2)}"
    result = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == user_id,
            Expense.date.like(f"{prefix}%"),
        )
        .scalar()
    )
    return round(float(result or 0), 2)


def prev_month(month: int, year: int):
    if month == 1:
        return 12, year - 1
    return month - 1, year


def calculate_rolling(db: Session, user_id: str, month: int, year: int) -> dict:
    """
    Rolling budget logic:
      available = current_budget + carry_forward
      carry_forward = prev_budget - prev_spent  (positive = surplus, negative = overspend)
    """
    # Current month budget record
    record = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == user_id,
        MonthlyBudget.month == month,
        MonthlyBudget.year == year,
    ).first()

    budget_amount = round(float(record.budget_amount), 2) if record else 0.0

    # Previous month carry-forward
    pm, py = prev_month(month, year)
    prev_record = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == user_id,
        MonthlyBudget.month == pm,
        MonthlyBudget.year == py,
    ).first()

    carry_forward = 0.0
    if prev_record:
        prev_budget = round(float(prev_record.budget_amount), 2)
        prev_spent = get_month_spent(db, user_id, pm, py)
        carry_forward = round(prev_budget - prev_spent, 2)

    available_budget = round(budget_amount + carry_forward, 2)
    spent = get_month_spent(db, user_id, month, year)
    remaining = round(available_budget - spent, 2)

    month_names = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']

    return {
        "month": month,
        "year": year,
        "label": f"{month_names[month]} {year}",
        "budget_amount": budget_amount,
        "carry_forward": carry_forward,
        "available_budget": available_budget,
        "spent": spent,
        "remaining": remaining,
        "is_set": record is not None,
    }


@router.get("")
async def get_rolling_budget(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now()
    m = month if month is not None else now.month
    y = year if year is not None else now.year

    result = calculate_rolling(db, current_user.id, m, y)
    return {"data": result, "metadata": {}, "error": None}


@router.post("")
async def set_rolling_budget(
    payload: SetBudgetPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.budget_amount < 0:
        raise HTTPException(status_code=400, detail="Budget amount must be non-negative")
    if not (1 <= payload.month <= 12):
        raise HTTPException(status_code=400, detail="Invalid month")

    record = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.month == payload.month,
        MonthlyBudget.year == payload.year,
    ).first()

    if record:
        record.budget_amount = payload.budget_amount
        record.updated_at = datetime.now()
    else:
        record = MonthlyBudget(
            user_id=current_user.id,
            month=payload.month,
            year=payload.year,
            budget_amount=payload.budget_amount,
            updated_at=datetime.now(),
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    result = calculate_rolling(db, current_user.id, payload.month, payload.year)
    return {"data": result, "metadata": {}, "error": None}
