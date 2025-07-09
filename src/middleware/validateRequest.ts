import { Request, Response, NextFunction, RequestHandler } from "express";
import { AnyZodObject } from "zod";

interface RequestValidationSchemas {
    body?: AnyZodObject;
    params?: AnyZodObject;
    query?: AnyZodObject;
}
export const validate = (schemas: RequestValidationSchemas): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            if (schemas.params) {
                req.params = await schemas.params.parseAsync(req.params);
            }
            if (schemas.query) {
                req.query = await schemas.query.parseAsync(req.query);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
