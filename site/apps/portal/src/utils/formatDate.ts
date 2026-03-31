export function formatDate(date: string | number | Date | null | undefined): string {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";

    return new Intl.DateTimeFormat("tr-TR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone: "Europe/Istanbul",
    }).format(d);
}

export function formatDateTime(date: string | number | Date | null | undefined): string {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";

    return new Intl.DateTimeFormat("tr-TR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Europe/Istanbul",
    }).format(d);
}
