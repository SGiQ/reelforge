from celery import Celery
from config import settings

celery_app = Celery(
    "reelforge",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_max_tasks_per_child=50,
    task_default_queue="reelforge_dev",
    # Prevent silent Redis disconnections
    broker_heartbeat=10,
    broker_heartbeat_checkrate=2,
    broker_connection_retry=True,
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=None,   # retry forever
    broker_transport_options={
        "visibility_timeout": 3600,       # 1 hour
        "socket_timeout": 30,
        "socket_connect_timeout": 30,
        "socket_keepalive": True,
    },
)
