from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/reelforge"
    REDIS_URL: str = "redis://localhost:6379/0"
    CLERK_SECRET_KEY: str = ""
    CLERK_JWT_ISSUER: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    BLOB_READ_WRITE_TOKEN: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    RENDER_OUTPUT_DIR: str = "/tmp/reelforge_renders"
    QR_DEFAULT_URL: str = "https://checkwellcare.com"
    ELEVENLABS_API_KEY: str = ""


settings = Settings()
