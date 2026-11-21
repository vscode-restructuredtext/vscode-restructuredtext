import * as assert from 'assert';

import {getRstformatEnv} from '../../src/util/rstformatEnv';

describe('getRstformatEnv', () => {
    it('forces Python stdio to UTF-8', () => {
        const env = getRstformatEnv({PATH: '/bin', PYTHONIOENCODING: 'gbk'});

        assert.strictEqual(env.PYTHONIOENCODING, 'utf-8');
        assert.strictEqual(env.PATH, '/bin');
    });

    it('does not mutate the source environment', () => {
        const source = {PYTHONIOENCODING: 'gbk'};

        getRstformatEnv(source);

        assert.strictEqual(source.PYTHONIOENCODING, 'gbk');
    });
});
