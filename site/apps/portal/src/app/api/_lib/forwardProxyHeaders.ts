import { NextRequest } from "next/server";

const FORWARDED_CONTEXT_HEADERS = [
    "x-forwarded-host",
    "x-original-host",
    "x-forwarded-proto",
    "x-forwarded-port",
    "x-forwarded-for",
    "x-custom-hostname",
    "x-real-ip",
    "cf-connecting-ip",
] as const;

export function copyForwardedContextHeaders(req: NextRequest, headers: Headers | Record<string, string>) {
    const setHeader =
        headers instanceof Headers
            ? (key: string, value: string) => headers.set(key, value)
            : (key: string, value: string) => {
                  headers[key] = value;
              };

    for (const headerName of FORWARDED_CONTEXT_HEADERS) {
        const headerValue = req.headers.get(headerName);
        if (headerValue && headerValue.trim().length > 0) {
            setHeader(headerName, headerValue);
        }
    }
}
