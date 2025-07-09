import { object } from "zod";

export class CustomError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;

        Object.setPrototypeOf(this, CustomError.prototype);
    }

}

export class BadRequestError extends CustomError {
    constructor(message = 'Bad Request: The request was invalid or cannot be otherwise served.') {
        super(message, 400);
        Object.setPrototypeOf(this, BadRequestError.prototype)
    }
}

export class NotFoundError extends CustomError {
    constructor(message = 'Error: Resource not found.') {
        super(message, 400);
        Object.setPrototypeOf(this, NotFoundError.prototype)
    }
}

export class UnauthorizedError extends CustomError {
    constructor(message = 'Unauthorize: Authentication is required to access thi resource') {
        super(message, 401);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

export class ForbiddenError extends CustomError {
    constructor(message = 'Forbidden: You do not have permission to access this resource') {
        super(message, 403);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

export class ConflictError extends CustomError {
    constructor(message = 'Conflict: The resource already exists or the request conflict with the current state.') {
        super(message, 409);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

export class InternalError extends CustomError {
    constructor(message = 'Internal Server Error: An unexpected error occurred on the server.'){
        super(message, 500);
        Object.setPrototypeOf(this, InternalError.prototype);
    }
}
