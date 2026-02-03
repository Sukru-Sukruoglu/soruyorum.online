
import { authRouter } from "../services/api-server/src/routers/auth";
import { prisma } from "@ks-interaktif/database";

// Mock Context
const ctx = {
    prisma,
    session: null,
    user: null
};

const caller = authRouter.createCaller(ctx);

async function main() {
    const email = `admin-${Date.now()}@test.com`;
    const password = "password123";
    const orgName = `Test Corp ${Date.now()}`;

    console.log(`Trying to register admin: ${email} for ${orgName}`);

    try {
        const result = await caller.registerAdmin({
            email,
            password,
            name: "Test Admin",
            organizationName: orgName
        });

        console.log("Registration successful!");
        console.log("Token:", result.token);
        console.log("User:", result.user);

        // Verify in DB
        const dbUser = await prisma.user.findUnique({ where: { id: result.user.id }, include: { organization: true } });
        console.log("DB User Organization:", dbUser?.organization?.name);

        if (dbUser?.organization?.name === orgName) {
            console.log("VERIFICATION PASSED: Organization created and linked.");
        } else {
            console.error("VERIFICATION FAILED: Organization mismatch.");
            process.exit(1);
        }

    } catch (e) {
        console.error("Registration failed:", e);
        process.exit(1);
    }
}

main();
