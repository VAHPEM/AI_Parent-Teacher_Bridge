class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400, body=None):
        self.message = message
        self.body = body
        self.status_code = status_code