from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Основные
    SECRET_KEY: str = "your-secret-key-here"
    DATABASE_URL: str = "sqlite:///./test.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "Obyavlyator"
    
    # Auth
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 4320
    ALGORITHM: str = "HS256"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # Parser
    PARSER_INTERVAL_MINUTES: int = 20
    PARSER_HEADLESS: bool = False
    PARSER_TIMEOUT: int = 60
    PARSER_MAX_PAGES: int = 2
    
    # Avito Proxy
    AVITO_PROXY: str = ""  # Format: "login:password@ip:port"
    AVITO_PROXY_CHANGE_URL: str = ""  # URL to change IP
    
    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
