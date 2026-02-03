import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "api-server/src/router";

export const trpc = createTRPCReact<AppRouter>();
