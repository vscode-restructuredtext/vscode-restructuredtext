export interface LinterReleasePolicy {
    name: string;
    packageName: string;
    latestStableVersion: string;
    supportedMajorVersions: number[];
    upgradeUrl: string;
}

export const releasePolicies: Record<string, LinterReleasePolicy> = {
    doc8: {
        name: 'doc8',
        packageName: 'doc8',
        latestStableVersion: '2.0.0',
        supportedMajorVersions: [2, 1],
        upgradeUrl: 'https://pypi.org/project/doc8/',
    },
    rstcheck: {
        name: 'rstcheck',
        packageName: 'rstcheck',
        latestStableVersion: '6.2.5',
        supportedMajorVersions: [6, 5],
        upgradeUrl: 'https://pypi.org/project/rstcheck/',
    },
    'rst-lint': {
        name: 'rst-lint',
        packageName: 'restructuredtext-lint',
        latestStableVersion: '2.0.2',
        supportedMajorVersions: [2, 1],
        upgradeUrl: 'https://pypi.org/project/restructuredtext-lint/',
    },
};
