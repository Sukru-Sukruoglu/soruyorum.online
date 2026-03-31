import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_BASE = process.env.PAYTR_SMOKE_API_BASE || 'https://api.soruyorum.online';
const PORTAL_BASE = process.env.PAYTR_SMOKE_PORTAL_BASE || 'https://soruyorum.online';

async function createTestAccount() {
  const stamp = Date.now();
  const now = new Date();
  const organizationId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const email = `paytr-smoke-${stamp}@example.com`;
  const password = 'PaytrSmoke123';
  const passwordHash = await bcrypt.hash(password, 10);

  const organization = await prisma.organizations.create({
    data: {
      id: organizationId,
      name: `PayTR Smoke ${stamp}`,
      slug: `paytr-smoke-${stamp}`,
      plan: 'free',
      created_at: now,
      updated_at: now,
    },
  });

  const user = await prisma.users.create({
    data: {
      id: userId,
      email,
      password_hash: passwordHash,
      name: 'PayTR Smoke',
      role: 'admin',
      organization_id: organization.id,
      email_verified: true,
      created_at: now,
      updated_at: now,
    },
  });

  return { email, password, organizationId: organization.id, userId: user.id };
}

async function cleanup(organizationId, userId, merchantOid) {
  await prisma.$transaction(async (tx) => {
    if (merchantOid) {
      await tx.subscriptions.deleteMany({
        where: {
          organization_id: organizationId,
          metadata: {
            path: ['merchant_oid'],
            equals: merchantOid,
          },
        },
      });
    } else {
      await tx.subscriptions.deleteMany({ where: { organization_id: organizationId } });
    }

    await tx.users.delete({ where: { id: userId } });
    await tx.organizations.delete({ where: { id: organizationId } });
  });
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: response.status, json };
}

let created;
let merchantOid = null;

try {
  created = await createTestAccount();
  console.log('created', created);

  const login = await requestJson(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: created.email, password: created.password }),
  });
  console.log('login', login);

  if (login.status !== 200 || !login.json?.token) {
    throw new Error(`Login failed: ${JSON.stringify(login)}`);
  }

  const token = login.json.token;

  const packages = await requestJson(`${PORTAL_BASE}/api/payments/paytr/packages`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('packages', packages);

  const iframeToken = await requestJson(`${PORTAL_BASE}/api/payments/paytr/iframe/token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ packageId: 'event-starter', addons: [] }),
  });
  console.log('iframeToken', iframeToken);

  merchantOid = iframeToken.json?.merchantOid ?? null;
} catch (error) {
  console.error('smoke_error', error);
  process.exitCode = 1;
} finally {
  if (created) {
    try {
      await cleanup(created.organizationId, created.userId, merchantOid);
      console.log('cleanup', { organizationId: created.organizationId, userId: created.userId, merchantOid });
    } catch (cleanupError) {
      console.error('cleanup_error', cleanupError);
      process.exitCode = 1;
    }
  }

  await prisma.$disconnect();
}