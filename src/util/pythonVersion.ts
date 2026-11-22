export const MINIMUM_PYTHON = {major: 3, minor: 11} as const;

export function isSupportedPythonVersion(
    major: number,
    minor: number
): boolean {
    if (!Number.isInteger(major) || !Number.isInteger(minor)) {
        return false;
    }

    return (
        major > MINIMUM_PYTHON.major ||
        (major === MINIMUM_PYTHON.major && minor >= MINIMUM_PYTHON.minor)
    );
}

export function formatPythonVersion(major: number, minor: number): string {
    return `${major}.${minor}`;
}
