from fastapi import APIRouter, Depends, HTTPException, Request
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.model import (
    User, Barber, QueueSlots, LeaveLetter,
    BookedStatus, UserRole, LeaveStatus, TypeUser,
    PageView, Notification, ShopSetting
)
from app.rolebase import require_roles
from app.backtask import get_current_user
from app.schemas import (
    PageViewCreate, ShopSettingUpdate, ShopSettingResponse,
    NotificationResponse
)
from datetime import date, timedelta
from typing import Literal
import calendar
 
router = APIRouter(prefix="/data_service", tags=["Data_Service"])
 
 
# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────
 
def _week_range(d: date) -> tuple[date, date]:
    start = d - timedelta(days=d.weekday())
    return start, start + timedelta(days=6)
 
def _month_range(d: date) -> tuple[date, date]:
    last = calendar.monthrange(d.year, d.month)[1]
    return d.replace(day=1), d.replace(day=last)
 
def _date_range(period: str, ref: date) -> tuple[date, date]:
    if period == "day":
        return ref, ref
    elif period == "week":
        return _week_range(ref)
    else:
        return _month_range(ref)
 
 
# ═══════════════════════════════════════════
# PAGE VIEW — นับผู้เข้าชม (req Dashboard)
# ═══════════════════════════════════════════
 
@router.post("/page_view", status_code=201)
def record_page_view(
    data   : PageViewCreate,
    request: Request,
    db     : Session = Depends(get_db),
):
    """
    Frontend เรียกทุกครั้งที่เข้าหน้า
    session_id = uuid ที่ frontend สร้างและเก็บใน localStorage
    UniqueConstraint(session_id, path) ป้องกันนับซ้ำ
    """
    # optional: ดึง user_id จาก token ถ้ามี
    user_id = None
    auth = request.headers.get("Authorization")
    if auth:
        try:
            from app.backtask import get_current_user as _gcu
            from app.database import get_db as _gdb
        except Exception:
            pass
 
    view = PageView(
        user_id=user_id,
        session_id=data.session_id,
        path=data.path,
    )
    db.add(view)
    try:
        db.commit()
    except Exception:
        db.rollback()   # unique constraint hit = already counted, ignore
    return {"ok": True}
 
 
@router.get("/page_view/summary")
def page_view_summary(
    period  : Literal["day", "week", "month"] = "day",
    ref_date: date = None,
    db      : Session = Depends(get_db),
    user    : User    = Depends(require_roles([UserRole.OWNER])),
):
    """จำนวนผู้เข้าชมเว็บ (req Dashboard ข้อ 10)"""
    today = ref_date or date.today()
    start, end = _date_range(period, today)
 
    total = (
        db.query(func.count(PageView.id))
        .filter(func.date(PageView.viewed_at).between(start, end))
        .scalar()
    )
    unique = (
        db.query(func.count(func.distinct(PageView.session_id)))
        .filter(func.date(PageView.viewed_at).between(start, end))
        .scalar()
    )
 
    # top pages
    top_pages = (
        db.query(PageView.path, func.count(PageView.id).label("cnt"))
        .filter(func.date(PageView.viewed_at).between(start, end))
        .group_by(PageView.path)
        .order_by(func.count(PageView.id).desc())
        .limit(5)
        .all()
    )
 
    return {
        "period"         : period,
        "start"          : start,
        "end"            : end,
        "total_views"    : total,
        "unique_visitors": unique,
        "top_pages"      : [{"path": p, "views": c} for p, c in top_pages],
    }
 
 
@router.get("/page_view/daily_series")
def page_view_daily_series(
    period  : Literal["week", "month"] = "week",
    ref_date: date = None,
    db      : Session = Depends(get_db),
    user    : User    = Depends(require_roles([UserRole.OWNER])),
):
    """จำนวน visitor รายวัน สำหรับ chart"""
    today = ref_date or date.today()
    start, end = _week_range(today) if period == "week" else _month_range(today)
 
    rows = (
        db.query(
            func.date(PageView.viewed_at).label("d"),
            func.count(func.distinct(PageView.session_id)).label("visitors"),
        )
        .filter(func.date(PageView.viewed_at).between(start, end))
        .group_by(func.date(PageView.viewed_at))
        .all()
    )
 
    pivot = {str(r.d): r.visitors for r in rows}
    delta = (end - start).days
    return [
        {"date": str(start + timedelta(days=i)),
         "visitors": pivot.get(str(start + timedelta(days=i)), 0)}
        for i in range(delta + 1)
    ]
 
 
# ═══════════════════════════════════════════
# QUEUE STATS
# ═══════════════════════════════════════════
 
@router.get("/queue/summary")
def queue_summary(
    period  : Literal["day", "week", "month"] = "day",
    ref_date: date = None,
    db      : Session = Depends(get_db),
    user    : User    = Depends(require_roles([UserRole.OWNER])),
):
    today = ref_date or date.today()
    start, end = _date_range(period, today)
 
    rows = (
        db.query(QueueSlots.status, func.count(QueueSlots.id))
        .filter(QueueSlots.date_working.between(start, end))
        .group_by(QueueSlots.status)
        .all()
    )
    summary = {s.value: 0 for s in BookedStatus}
    for status, cnt in rows:
        summary[status.value] = cnt
 
    total   = sum(summary.values())
    served  = summary.get("COMPLETE", 0)
    no_show = summary.get("NO_SHOW", 0)
 
    return {
        "period"         : period,
        "start"          : start,
        "end"            : end,
        "total_slots"    : total,
        "served"         : served,
        "no_show"        : no_show,
        "completion_rate": round(served / total * 100, 1) if total else 0,
        "no_show_rate"   : round(no_show / total * 100, 1) if total else 0,
        "by_status"      : summary,
    }
 
 
@router.get("/queue/daily_series")
def queue_daily_series(
    period  : Literal["week", "month"] = "week",
    ref_date: date = None,
    db      : Session = Depends(get_db),
    user    : User    = Depends(require_roles([UserRole.OWNER])),
):
    today = ref_date or date.today()
    start, end = _week_range(today) if period == "week" else _month_range(today)
 
    rows = (
        db.query(QueueSlots.date_working, QueueSlots.status, func.count(QueueSlots.id))
        .filter(QueueSlots.date_working.between(start, end))
        .group_by(QueueSlots.date_working, QueueSlots.status)
        .order_by(QueueSlots.date_working)
        .all()
    )
 
    pivot: dict[date, dict] = {}
    for d, status, cnt in rows:
        if d not in pivot:
            pivot[d] = {s.value: 0 for s in BookedStatus}
        pivot[d][status.value] = cnt
 
    delta = (end - start).days
    result = []
    for i in range(delta + 1):
        d = start + timedelta(days=i)
        entry = pivot.get(d, {s.value: 0 for s in BookedStatus})
        entry["date"] = str(d)
        result.append(entry)
    return result
 
 
@router.get("/queue/walkin_vs_online")
def queue_walkin_vs_online(
    period  : Literal["day", "week", "month"] = "week",
    ref_date: date = None,
    db      : Session = Depends(get_db),
    user    : User    = Depends(require_roles([UserRole.OWNER])),
):
    today = ref_date or date.today()
    start, end = _date_range(period, today)
 
    rows = (
        db.query(QueueSlots.status_user, func.count(QueueSlots.id))
        .filter(
            QueueSlots.date_working.between(start, end),
            QueueSlots.status_user != TypeUser.NONE,
        )
        .group_by(QueueSlots.status_user)
        .all()
    )
    data = {t.value: 0 for t in TypeUser if t != TypeUser.NONE}
    for t, c in rows:
        data[t.value] = c
    return {"period": period, "start": start, "end": end, "by_type": data}
 
 
# ═══════════════════════════════════════════
# CUSTOMER STATS
# ═══════════════════════════════════════════
 
@router.get("/customer/summary")
def customer_summary(
    db  : Session = Depends(get_db),
    user: User    = Depends(require_roles([UserRole.OWNER])),
):
    today = date.today()
    cur_start, cur_end   = _month_range(today)
    prev_start, prev_end = _month_range(cur_start - timedelta(days=1))
 
    total = db.query(func.count(User.id)).filter(User.rolestatus == UserRole.CUSTOMER).scalar()
 
    new_this  = db.query(func.count(User.id)).filter(
        User.rolestatus == UserRole.CUSTOMER,
        func.date(User.create_at).between(cur_start, cur_end)
    ).scalar()
 
    new_prev  = db.query(func.count(User.id)).filter(
        User.rolestatus == UserRole.CUSTOMER,
        func.date(User.create_at).between(prev_start, prev_end)
    ).scalar()
 
    active = db.query(func.count(func.distinct(QueueSlots.customer_id))).filter(
        QueueSlots.date_working.between(cur_start, cur_end),
        QueueSlots.customer_id.isnot(None),
    ).scalar()
 
    change     = new_this - new_prev
    change_pct = round(change / new_prev * 100, 1) if new_prev else None
 
    return {
        "total_customers"  : total,
        "new_this_month"   : new_this,
        "new_prev_month"   : new_prev,
        "monthly_change"   : change,
        "monthly_change_pct": change_pct,
        "active_this_month": active,
    }
 
 
@router.get("/customer/monthly_series")
def customer_monthly_series(
    months: int = 6,
    db    : Session = Depends(get_db),
    user  : User    = Depends(require_roles([UserRole.OWNER])),
):
    today, result = date.today(), []
    for i in range(months - 1, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12; y -= 1
        target = today.replace(year=y, month=m, day=1)
        s, e = _month_range(target)
        cnt = db.query(func.count(User.id)).filter(
            User.rolestatus == UserRole.CUSTOMER,
            func.date(User.create_at).between(s, e)
        ).scalar()
        result.append({"month": f"{y}-{m:02d}", "label": target.strftime("%b %Y"), "new_customers": cnt})
    return result
 
 
# ═══════════════════════════════════════════
# LEAVE STATS
# ═══════════════════════════════════════════
 
@router.get("/leave/summary")
def leave_summary(
    period  : Literal["week", "month", "all"] = "month",
    ref_date: date = None,
    db      : Session = Depends(get_db),
    user    : User    = Depends(require_roles([UserRole.OWNER])),
):
    today = ref_date or date.today()
    base  = db.query(LeaveLetter)
    if period == "week":
        s, e = _week_range(today);   base = base.filter(LeaveLetter.date_leave.between(s, e))
    elif period == "month":
        s, e = _month_range(today);  base = base.filter(LeaveLetter.date_leave.between(s, e))
 
    rows    = base.with_entities(LeaveLetter.status, func.count(LeaveLetter.id)).group_by(LeaveLetter.status).all()
    summary = {s.value: 0 for s in LeaveStatus}
    for status, cnt in rows:
        summary[status.value] = cnt
 
    total    = sum(summary.values())
    approved = summary.get("APPROVED", 0)
    rejected = summary.get("REJECTED", 0)
 
    return {
        "period"         : period,
        "total"          : total,
        "approved"       : approved,
        "rejected"       : rejected,
        "pending"        : summary.get("PENDING", 0),
        "approval_rate"  : round(approved / total * 100, 1) if total else 0,
        "rejection_rate" : round(rejected / total * 100, 1) if total else 0,
    }
 
 
@router.get("/leave/by_barber")
def leave_by_barber(
    period  : Literal["month", "all"] = "all",
    ref_date: date = None,
    db      : Session = Depends(get_db),
    user    : User    = Depends(require_roles([UserRole.OWNER])),
):
    today = ref_date or date.today()
    q = (
        db.query(Barber.id, User.firstname, User.lastname, LeaveLetter.status, func.count(LeaveLetter.id))
        .join(LeaveLetter, LeaveLetter.barber_id == Barber.id)
        .join(User, User.id == Barber.user_id)
    )
    if period == "month":
        s, e = _month_range(today)
        q = q.filter(LeaveLetter.date_leave.between(s, e))
 
    rows = q.group_by(Barber.id, User.firstname, User.lastname, LeaveLetter.status).all()
    barbers: dict = {}
    for bid, fn, ln, status, cnt in rows:
        if bid not in barbers:
            barbers[bid] = {"barber_id": bid, "name": f"{fn} {ln or ''}".strip(),
                            "APPROVED": 0, "REJECTED": 0, "PENDING": 0, "total": 0}
        barbers[bid][status.value] += cnt
        barbers[bid]["total"] += cnt
 
    return sorted(barbers.values(), key=lambda x: x["total"], reverse=True)
 
 
@router.get("/leave/monthly_series")
def leave_monthly_series(
    months: int = 6,
    db    : Session = Depends(get_db),
    user  : User    = Depends(require_roles([UserRole.OWNER])),
):
    today, result = date.today(), []
    for i in range(months - 1, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12; y -= 1
        target = today.replace(year=y, month=m, day=1)
        s, e = _month_range(target)
        rows = db.query(LeaveLetter.status, func.count(LeaveLetter.id)).filter(
            LeaveLetter.date_leave.between(s, e)
        ).group_by(LeaveLetter.status).all()
        entry = {"month": f"{y}-{m:02d}", "label": target.strftime("%b %Y"),
                 "APPROVED": 0, "REJECTED": 0, "PENDING": 0}
        for status, cnt in rows:
            entry[status.value] = cnt
        result.append(entry)
    return result
 
 
# ═══════════════════════════════════════════
# OVERVIEW — single call สำหรับ Dashboard
# ═══════════════════════════════════════════
 
@router.get("/overview")
def dashboard_overview(
    db  : Session = Depends(get_db),
    user: User    = Depends(require_roles([UserRole.OWNER])),
):
    today = date.today()
    cur_s, cur_e   = _month_range(today)
    prev_s, prev_e = _month_range(cur_s - timedelta(days=1))
    wk_s, wk_e    = _week_range(today)
 
    total_cust = db.query(func.count(User.id)).filter(User.rolestatus == UserRole.CUSTOMER).scalar()
    total_emp  = db.query(func.count(User.id)).filter(User.rolestatus == UserRole.EMPLOYEE).scalar()
    new_this   = db.query(func.count(User.id)).filter(
        User.rolestatus == UserRole.CUSTOMER, func.date(User.create_at).between(cur_s, cur_e)).scalar()
    new_prev   = db.query(func.count(User.id)).filter(
        User.rolestatus == UserRole.CUSTOMER, func.date(User.create_at).between(prev_s, prev_e)).scalar()
 
    def _queue_map(start, end):
        rows = db.query(QueueSlots.status, func.count(QueueSlots.id)).filter(
            QueueSlots.date_working.between(start, end)).group_by(QueueSlots.status).all()
        m = {s.value: 0 for s in BookedStatus}
        for s, c in rows: m[s.value] = c
        return m
 
    def _leave_map(filt=None):
        q = db.query(LeaveLetter.status, func.count(LeaveLetter.id))
        if filt is not None: q = q.filter(filt)
        rows = q.group_by(LeaveLetter.status).all()
        m = {s.value: 0 for s in LeaveStatus}
        for s, c in rows: m[s.value] = c
        return m
 
    # page views today
    views_today = db.query(func.count(func.distinct(PageView.session_id))).filter(
        func.date(PageView.viewed_at) == today).scalar()
 
    top_leave = (
        db.query(User.firstname, User.lastname, func.count(LeaveLetter.id).label("n"))
        .join(Barber, Barber.user_id == User.id)
        .join(LeaveLetter, LeaveLetter.barber_id == Barber.id)
        .group_by(User.id, User.firstname, User.lastname)
        .order_by(func.count(LeaveLetter.id).desc())
        .limit(5).all()
    )
 
    change     = new_this - new_prev
    change_pct = round(change / new_prev * 100, 1) if new_prev else None
 
    return {
        "users": {
            "total_customers"    : total_cust,
            "total_employees"    : total_emp,
            "new_this_month"     : new_this,
            "new_prev_month"     : new_prev,
            "monthly_change"     : change,
            "monthly_change_pct" : change_pct,
        },
        "queue": {
            "today"    : _queue_map(today, today),
            "this_week": _queue_map(wk_s, wk_e),
            "this_month": _queue_map(cur_s, cur_e),
        },
        "leave": {
            "all_time" : _leave_map(),
            "this_month": _leave_map(LeaveLetter.date_leave.between(cur_s, cur_e)),
            "top_leave_barbers": [
                {"name": f"{r.firstname} {r.lastname or ''}".strip(), "leave_count": r.n}
                for r in top_leave
            ],
        },
        "page_views": {
            "today": views_today,
        },
    }
 
 
# ═══════════════════════════════════════════
# NOTIFICATION (req: ระบบแจ้งเตือน)
# ═══════════════════════════════════════════
 
@router.get("/notifications", response_model=list[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    user       : User = Depends(get_current_user),
    db         : Session = Depends(get_db),
):
    """ดูการแจ้งเตือนของตัวเอง"""
    q = db.query(Notification).filter(Notification.user_id == user.id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.create_at.desc()).limit(50).all()
 
 
@router.patch("/notifications/{notif_id}/read")
def mark_read(
    notif_id: int,
    user    : User = Depends(get_current_user),
    db      : Session = Depends(get_db),
):
    n = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == user.id,
    ).first()
    if not n:
        raise HTTPException(404, "Not found")
    n.is_read = True
    db.commit()
    return {"ok": True}
 
 
@router.patch("/notifications/read_all")
def mark_all_read(
    user: User = Depends(get_current_user),
    db  : Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}
 
 
# ═══════════════════════════════════════════
# SHOP SETTING (req: จัดการรายละเอียดเว็บ)
# ═══════════════════════════════════════════
 
@router.get("/shop_setting", response_model=ShopSettingResponse)
def get_shop_setting(db: Session = Depends(get_db)):
    """Public — ดูข้อมูลร้าน"""
    setting = db.query(ShopSetting).first()
    if not setting:
        # auto-create default
        setting = ShopSetting(shop_name="Barber Shop")
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting
 
 
@router.patch("/shop_setting", response_model=ShopSettingResponse)
def update_shop_setting(
    data: ShopSettingUpdate,
    user: User    = Depends(require_roles([UserRole.OWNER])),
    db  : Session = Depends(get_db),
):
    """Owner อัปเดตข้อมูลร้าน"""
    setting = db.query(ShopSetting).first()
    if not setting:
        setting = ShopSetting()
        db.add(setting)
 
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(setting, field, value)
 
    db.commit()
    db.refresh(setting)
    return setting
