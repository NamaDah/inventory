import { Request, Response, NextFunction, RequestHandler } from "express";
import { AnyZodObject, ZodError, z } from "zod";
import { URLSearchParams } from "url";

interface RequestValidationSchemas {
    body?: AnyZodObject;
    params?: AnyZodObject;
    query?: AnyZodObject;
}


export const validate = (schemas: RequestValidationSchemas): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            console.log('--- DEBUG VALIDATE MIDDLEWARE ---');
            console.log('1. req.url:', req.url);
            console.log('2. req.query (awal):', req.query);

            let queryToValidate: Record<string, any> = {};

            if (schemas.query) {
                console.log('3. Schema for query is defined.');

                const urlParts = req.url.split('?');
                if (urlParts.length > 1) {
                    const queryString = urlParts[1];
                    console.log('4. Raw Query String:', queryString);

                    const manualQueryParams = new URLSearchParams(queryString);
                    queryToValidate = Object.fromEntries(manualQueryParams.entries());

                    console.log('5. Manual Parsed Query:', Object.fromEntries(manualQueryParams.entries()));
                    console.log('6. Nilai token dari URLSearchParams:', manualQueryParams.get('token'));

                } else {
                    console.log('4. No query string found in URL.');
                }

                req.query = await schemas.query.parseAsync(queryToValidate);
                console.log('7. req.query (setelah Zod parse):', req.query);
            }
            if (schemas.body) {
                req.body = await schemas.body.parseAsync({ ...req.body });
            }
            if (schemas.params) {
                req.params = await schemas.params.parseAsync({ ...req.params });
            }
            // if (schemas.query) {
            //     req.query = await schemas.query.parseAsync({ ...req.query });
            // }
            next(); // Validation successful, proceed to the next middleware/route handler
        } catch (error) {
            if (error instanceof ZodError) {
                console.error('8. ZodError caught:', error.errors);
                res.status(400).json({
                    message: 'Validation failed',
                    errors: error.errors.map(issue => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                        code: issue.code,
                    })),
                });
                return;
            }
            console.log('9. Non-Zod error caught:', error)
            // For any other type of error, pass it to the next error-handling middleware
            next(error);
        } finally {
            console.log('--- END DEBUG VALIDATE MIDDLEWARE ---');
        }
    };
