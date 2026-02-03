import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@ks-interaktif/api-server";

export const trpc = createTRPCReact<AppRouter>();
