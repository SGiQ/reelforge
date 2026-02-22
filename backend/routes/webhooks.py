import os
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from svix.webhooks import Webhook, WebhookVerificationError

from db.database import get_db
from db.models import Brand

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/clerk")
async def clerk_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    # Get the raw body string and headers
    payload = await request.body()
    headers = request.headers

    # Get the Clerk webhook secret from env
    secret = os.getenv("CLERK_WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    # Verify the webhook signature
    try:
        wh = Webhook(secret)
        evt = wh.verify(payload, headers)
    except WebhookVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Process the event
    event_type = evt.get("type")
    
    if event_type == "user.created":
        data = evt.get("data", {})
        user_id = data.get("id")
        
        if user_id:
            # Create an empty Brand for the new user so they can start rendering
            new_brand = Brand(
                clerk_user_id=user_id,
                name="My Brand"
            )
            db.add(new_brand)
            await db.commit()

    return {"status": "success"}
