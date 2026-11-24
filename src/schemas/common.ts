export function parseId(raw: string): number | null {
    const id = Number(raw);

    if (id <= 0 || !Number.isInteger(id)) {
        return null;
    }

    return id;
}