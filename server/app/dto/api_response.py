from pydantic import BaseModel
from typing import Any, Optional

class ApiResponse(BaseModel):
    body: Any = None
    message: Optional[str] = None