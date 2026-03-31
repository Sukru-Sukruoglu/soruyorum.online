import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function printUsage() {
  console.log("Usage:");
  console.log("  node scripts/grant-spring-pilot.mjs --email owner@example.com");
  console.log("  node scripts/grant-spring-pilot.mjs --org-id <organization-id>");
  console.log("  node scripts/grant-spring-pilot.mjs --org-slug <organization-slug>");
}

async function resolveOrganization() {
  const email = getArg("--email");
  const organizationId = getArg("--org-id");
  const organizationSlug = getArg("--org-slug");

  if (email) {
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        organization_id: true,
        email: true,
        name: true,
        company: true,
        phone_verified: true,
        email_verified: true,
      },
    });

    if (!user?.organization_id) {
      throw new Error(`Organization not found for email: ${email}`);
    }

    return {
      where: { id: user.organization_id },
      owner: user,
    };
  }

  if (organizationId) {
    return { where: { id: organizationId }, owner: null };
  }

  if (organizationSlug) {
    return { where: { slug: organizationSlug }, owner: null };
  }

  printUsage();
  throw new Error("Missing organization selector.");
}

async function main() {
  const plan = (process.env.SPRING_PILOT_PLAN || "spring_pilot_500").trim();
  const startsAt = process.env.SPRING_PILOT_START || "2026-04-01T00:00:00+03:00";
  const endsAt = process.env.SPRING_PILOT_END || "2026-04-30T23:59:59+03:00";

  const target = await resolveOrganization();
  const organization = await prisma.organizations.findFirst({
    where: target.where,
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
    },
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const updated = await prisma.organizations.update({
    where: { id: organization.id },
    data: {
      plan,
      updated_at: new Date(),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
    },
  });

  console.log("Spring pilot granted:");
  console.log(JSON.stringify({
    organization: updated,
    window: {
      startsAt,
      endsAt,
    },
    owner: target.owner,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });