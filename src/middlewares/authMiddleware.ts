import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

        req.user = { id: decoded.id };
        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export type { AuthenticatedRequest };
