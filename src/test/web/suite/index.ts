import {runMocha} from './bootstrap';
import {defineTests} from './web.test';

export async function run(): Promise<void> {
    await runMocha(defineTests);
}
