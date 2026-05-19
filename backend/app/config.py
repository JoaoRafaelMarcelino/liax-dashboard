from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://admin:1i4x%40Liax@host.docker.internal:5432/dashboard"
    secret_key: str = "liax-dashboard-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    clickup_token: str = "pk_78841674_UDO4MG6XRKSWRWLKJW0TMTHOO4B0A4K7"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
