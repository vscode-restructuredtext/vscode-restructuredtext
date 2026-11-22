import * as assert from 'assert';

import {
    MINIMUM_PYTHON,
    formatPythonVersion,
    isSupportedPythonVersion,
} from '../../src/util/pythonVersion';

describe('pythonVersion', () => {
    it('accepts the minimum supported version', () => {
        assert.strictEqual(
            isSupportedPythonVersion(
                MINIMUM_PYTHON.major,
                MINIMUM_PYTHON.minor
            ),
            true
        );
    });

    it('accepts newer versions', () => {
        assert.strictEqual(isSupportedPythonVersion(3, 12), true);
        assert.strictEqual(isSupportedPythonVersion(4, 0), true);
    });

    it('rejects older versions', () => {
        assert.strictEqual(isSupportedPythonVersion(3, 10), false);
        assert.strictEqual(isSupportedPythonVersion(2, 7), false);
    });

    it('rejects invalid input', () => {
        assert.strictEqual(isSupportedPythonVersion(Number.NaN, 11), false);
        assert.strictEqual(isSupportedPythonVersion(3, 11.5), false);
    });

    it('formats a version', () => {
        assert.strictEqual(formatPythonVersion(3, 11), '3.11');
    });
});
