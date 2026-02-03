import { Lucia } from "lucia";
export declare const lucia: Lucia<Record<never, never>, {
    email: string;
    role: string;
    organizationId: string | null;
}>;
declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
    }
}
interface DatabaseUserAttributes {
    email: string;
    role: string;
    organization_id: string | null;
}
export {};
//# sourceMappingURL=lucia.d.ts.map