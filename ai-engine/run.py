import uvicorn
from app.config import settings

if __name__ == "__main__":
   uvicorn.run(
       "app.main:app",
       host=settings.API_HOST,
       port=settings.get_port,
       reload=False  # Disable reload in production
   )