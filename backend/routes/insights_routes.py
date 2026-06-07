from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, CustomBudgetCategory, MonthlyBudget
from middleware import get_current_user
from utils.query_helpers import get_filtered_expenses, expenses_to_dataframe
from services.insights_engine import InsightsEngine
from typing import Optional
import pandas as pd
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["insights"])


class CustomBudgetCategoryCreate(BaseModel):
    category: str
    limit: float
    month: int
    year: int


def pick_category_emoji(category: str) -> str:
    name = (category or "").strip().lower()
    keyword_map = [
        (["fitness", "gym", "workout", "exercise", "training"], "🏋️"),
        (["pet", "pets", "dog", "cat", "vet"], "🐾"),
        (["gift", "gifts"], "🎁"),
        (["beauty", "makeup", "skincare", "salon"], "💄"),
        (["coffee", "cafe"], "☕"),
        (["food", "dining", "restaurant"], "🍽️"),
        (["transport", "taxi", "uber", "bus", "metro"], "🚌"),
        (["travel", "trip", "vacation", "flight"], "✈️"),
        (["rent", "home", "housing"], "🏠"),
        (["health", "healthcare", "doctor", "medical"], "🩺"),
        (["education", "study", "course", "books"], "🎓"),
        (["shopping", "clothes", "fashion"], "🛍️"),
        (["entertainment", "movie", "games", "gaming"], "🎮"),
        (["savings", "save", "investment"], "💸"),
        (["utilities", "electricity", "water", "internet"], "💡"),
    ]
    for keywords, emoji in keyword_map:
        if any(word in name for word in keywords):
            return emoji
    if name:
        return "✨"
    return "•"

def aggregate_time_series(df):
    if df.empty:
        return pd.DataFrame(columns=['date', 'total_amount'])
    
    daily = df.groupby('date')['amount'].sum().reset_index()
    daily.columns = ['date', 'total_amount']
    daily['date'] = pd.to_datetime(daily['date'])
    
    date_range = pd.date_range(start=daily['date'].min(), end=daily['date'].max(), freq='D')
    full_range = pd.DataFrame({'date': date_range})
    daily = full_range.merge(daily, on='date', how='left')
    daily['total_amount'] = daily['total_amount'].fillna(0)
    daily['date'] = daily['date'].dt.strftime('%Y-%m-%d')
    
    return daily

@router.get("/suggestions")
async def suggestions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expenses = get_filtered_expenses(db, current_user)
    df = expenses_to_dataframe(expenses)
    
    if df.empty:
        return {
            "data": [],
            "metadata": {},
            "error": "No data"
        }
    
    df_agg = aggregate_time_series(df)
    engine = InsightsEngine(df, df_agg)
    return engine.get_insights()

@router.get("/forecast")
async def forecast_simple(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expenses = get_filtered_expenses(db, current_user)
    df = expenses_to_dataframe(expenses)
    
    if df.empty:
        return {
            "data": {"forecast": [], "trend": "stable"},
            "metadata": {},
            "error": "No data"
        }
    
    df_agg = aggregate_time_series(df)
    engine = InsightsEngine(df, df_agg)
    return engine.get_forecast(days_ahead=30)

@router.get("/forecast/lstm")
async def forecast_lstm(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expenses = get_filtered_expenses(db, current_user)
    df = expenses_to_dataframe(expenses)
    
    if df.empty:
        return {
            "data": {"forecast": [], "trend": "stable"},
            "metadata": {},
            "error": "No data"
        }
    
    df_agg = aggregate_time_series(df)
    engine = InsightsEngine(df, df_agg)
    return engine.get_forecast(days_ahead=30)

@router.get("/budget/smart")
async def get_smart_budget(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expenses = get_filtered_expenses(db, current_user)
    df = expenses_to_dataframe(expenses)
    
    if df.empty:
        return {
            "data": {"budget": [], "total": 0},
            "metadata": {},
            "error": "No data"
        }
    
    df_agg = aggregate_time_series(df)
    engine = InsightsEngine(df, df_agg)
    
    if month is None or year is None:
        from datetime import datetime
        now = datetime.now()
        month, year = now.month, now.year
    
    result = engine.get_current_budgets(month, year)
    custom_categories = db.query(CustomBudgetCategory).filter(
        CustomBudgetCategory.user_id == current_user.id,
        CustomBudgetCategory.month == month,
        CustomBudgetCategory.year == year,
    ).all()

    budgets = result.get("data", {}).get("budget", [])
    by_category = {str(item["category"]).lower(): item for item in budgets}

    cur_df = engine.get_filtered_expenses(month=month, year=year)
    current_lookup = {}
    if not cur_df.empty:
        grouped = cur_df.groupby("category")["amount"].sum().to_dict()
        current_lookup = {str(k).lower(): round(float(v), 2) for k, v in grouped.items()}

    for custom in custom_categories:
        key = custom.category.lower()
        current = current_lookup.get(key, 0.0)
        pct = round((current / custom.limit * 100) if custom.limit > 0 else 0, 1)
        payload = {
            "category": custom.category,
            "limit": round(float(custom.limit), 2),
            "current": current,
            "percentage": pct,
            "basis": "custom_category",
            "hist_mean": 0,
            "hist_std": 0,
            "months_of_data": 0,
            "is_custom": True,
            "icon_emoji": custom.icon_emoji or pick_category_emoji(custom.category),
        }
        if key in by_category:
            by_category[key].update(payload)
        else:
            budgets.append(payload)

    for item in budgets:
        item.setdefault("is_custom", False)
        item.setdefault("icon_emoji", None)

    budgets.sort(key=lambda x: (x.get("current", 0), x.get("limit", 0)), reverse=True)
    result["data"]["budget"] = budgets
    result["data"]["total"] = round(sum(float(item.get("limit", 0) or 0) for item in budgets), 2)
    result["metadata"]["has_custom_categories"] = any(item.get("is_custom") for item in budgets)
    return result


@router.post("/budget/custom")
async def create_custom_budget_category(
    payload: CustomBudgetCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = (payload.category or "").strip()
    if not category:
        raise HTTPException(status_code=400, detail="Category name is required")
    if payload.limit < 0:
        raise HTTPException(status_code=400, detail="Budget limit must be non-negative")

    existing = db.query(CustomBudgetCategory).filter(
        CustomBudgetCategory.user_id == current_user.id,
        CustomBudgetCategory.month == payload.month,
        CustomBudgetCategory.year == payload.year,
        CustomBudgetCategory.category == category,
    ).first()

    icon_emoji = pick_category_emoji(category)
    if existing:
        existing.limit = payload.limit
        existing.icon_emoji = icon_emoji
        db.commit()
        db.refresh(existing)
        record = existing
    else:
        record = CustomBudgetCategory(
            user_id=current_user.id,
            category=category,
            limit=payload.limit,
            month=payload.month,
            year=payload.year,
            icon_emoji=icon_emoji,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    return {
        "data": {
            "id": record.id,
            "category": record.category,
            "limit": round(float(record.limit), 2),
            "month": record.month,
            "year": record.year,
            "icon_emoji": record.icon_emoji,
            "is_custom": True,
        },
        "metadata": {},
        "error": None,
    }

@router.get("/expenses/anomalies")
async def get_anomalies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expenses = get_filtered_expenses(db, current_user)
    df = expenses_to_dataframe(expenses)
    
    if df.empty:
        return {
            "data": {"alerts": []},
            "metadata": {},
            "error": "No data"
        }
    
    df_agg = aggregate_time_series(df)
    engine = InsightsEngine(df, df_agg)
    return engine.get_anomalies()

class MonthlyBudgetSet(BaseModel):
    month: int
    year: int
    amount: float


@router.get("/budget/monthly")
async def get_monthly_budget(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    now = datetime.now()
    if month is None:
        month = now.month
    if year is None:
        year = now.year

    # Budget set for this month
    record = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.month == month,
        MonthlyBudget.year == year,
    ).first()
    set_amount = float(record.amount) if record else 0.0

    # Previous month
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1

    prev_record = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.month == prev_month,
        MonthlyBudget.year == prev_year,
    ).first()

    carry_forward = 0.0  # positive = savings carried over, negative = overspend deducted
    prev_set = 0.0
    prev_spent = 0.0

    if prev_record:
        prev_set = float(prev_record.amount)
        prev_expenses = get_filtered_expenses(db, current_user, month=prev_month, year=prev_year)
        prev_spent = round(sum(e.amount for e in prev_expenses), 2)
        # positive = unused, negative = overspent
        carry_forward = round(prev_set - prev_spent, 2)

    # Available = this month's budget + carry_forward (can be negative)
    available = round(set_amount + carry_forward, 2)

    # Current month spending
    cur_expenses = get_filtered_expenses(db, current_user, month=month, year=year)
    spent = round(sum(e.amount for e in cur_expenses), 2)
    remaining = round(available - spent, 2)

    return {
        "data": {
            "month": month,
            "year": year,
            "set_amount": round(set_amount, 2),
            "carry_forward": carry_forward,      # positive = savings, negative = overspend
            "available": available,               # set_amount + carry_forward
            "spent": spent,
            "remaining": remaining,
            "prev_month": prev_month,
            "prev_year": prev_year,
            "prev_set": round(prev_set, 2),
            "prev_spent": round(prev_spent, 2),
            "has_budget": record is not None,
        },
        "metadata": {},
        "error": None,
    }


@router.post("/budget/monthly")
async def set_monthly_budget(
    payload: MonthlyBudgetSet,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.amount < 0:
        raise HTTPException(status_code=400, detail="Amount must be non-negative")

    record = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.month == payload.month,
        MonthlyBudget.year == payload.year,
    ).first()

    if record:
        record.amount = payload.amount
    else:
        record = MonthlyBudget(
            user_id=current_user.id,
            month=payload.month,
            year=payload.year,
            amount=payload.amount,
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    return {
        "data": {
            "month": record.month,
            "year": record.year,
            "amount": round(float(record.amount), 2),
        },
        "metadata": {},
        "error": None,
    }
