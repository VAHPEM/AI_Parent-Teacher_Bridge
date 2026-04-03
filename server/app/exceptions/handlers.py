from fastapi import Request
from fastapi.responses import JSONResponse

from app.exceptions.app_exception import AppException


async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "body": exc.body,
            "message": exc.message
        }
    )