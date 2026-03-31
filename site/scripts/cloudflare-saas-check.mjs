#!/usr/bin/env node

import fs from "fs";
import path from "path";
import process from "process";
import dns from "dns/promises";

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(path.join(process.cwd(), ".env"));

const zoneId = (process.env.CLOUDFLARE_SAAS_ZONE_ID || "").trim();
const apiToken = (process.env.CLOUDFLARE_SAAS_API_TOKEN || "").trim();
const connectTarget = (process.env.DOMAIN_CONNECT_TARGET || "connect.soruyorum.live").trim().toLowerCase();
const systemBase = (process.env.DOMAIN_SYSTEM_BASE || "soruyorum.live").trim().toLowerCase();

if (!zoneId || !apiToken) {
  console.error("Eksik env: CLOUDFLARE_SAAS_ZONE_ID ve CLOUDFLARE_SAAS_API_TOKEN gerekli.");
  process.exit(1);
}

async function callCloudflare(pathname) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const message =
      payload?.errors?.[0]?.message ||
      payload?.messages?.[0]?.message ||
      `Cloudflare request failed (${response.status})`;
    throw new Error(message);
  }

  return payload.result;
}

async function main() {
  console.log(`Zone ID: ${zoneId}`);
  console.log(`System base: ${systemBase}`);
  console.log(`Connect target: ${connectTarget}`);

  let cnameRecords = [];
  try {
    cnameRecords = await dns.resolveCname(connectTarget);
  } catch {
    cnameRecords = [];
  }

  const customHostnames = await callCloudflare(`/zones/${zoneId}/custom_hostnames?per_page=5`);

  console.log("");
  console.log("Cloudflare Custom Hostnames API erisimi: OK");
  console.log(`Mevcut custom hostname sayisi: ${Array.isArray(customHostnames) ? customHostnames.length : 0}`);

  if (cnameRecords.length > 0) {
    console.log(`DNS kontrolu: ${connectTarget} -> ${cnameRecords.join(", ")}`);
  } else {
    console.log(`DNS kontrolu: ${connectTarget} icin CNAME bulunamadi veya record A/AAAA olabilir.`);
  }

  console.log("");
  console.log("Sonraki adimlar:");
  console.log("1. Cloudflare panelinde soruyorum.live zone ID dogrulayin.");
  console.log("2. connect.soruyorum.live kaydinin proxied oldugunu dogrulayin.");
  console.log("3. connect.soruyorum.live fallback origin'inin active oldugunu dogrulayin.");
  console.log("4. Sonra panelden test domaini ekleyip verify edin.");
}

main().catch((error) => {
  console.error("Cloudflare SaaS kontrolu basarisiz:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
