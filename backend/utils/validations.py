from datetime import date


VALID_RENTAL_STATUSES = {
    "pending",
    "approved",
    "rejected",
    "rented",
    "return_requested",
    "returned",
}


def ensure_end_after_start(start_date: date, end_date: date) -> None:
    # Your API spec says end_date must be after start_date
    if end_date <= start_date:
        raise ValueError("end_date must be after start_date")


def calculate_total_cost(start_date: date, end_date: date, price_per_day: int) -> int:
    # Spec logic: days = (end_date - start_date)
    days = (end_date - start_date).days
    return max(0, days * price_per_day)
