/**
 * Build the environment for the rstformat child process.
 *
 * Python otherwise uses the console encoding (for example GBK on Chinese
 * Windows), which corrupts UTF-8 documents passed through stdin/stdout.
 */
export function getRstformatEnv(
    env: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv {
    return {...env, PYTHONIOENCODING: 'utf-8'};
}
