declare global {
    namespace Express {
        interface Request {
            organizationId?: string;
            userId?: string;
            userRole?: string;
            userEmail?: string;
        }
    }
}

export { };
