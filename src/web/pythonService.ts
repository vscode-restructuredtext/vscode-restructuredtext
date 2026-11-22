import * as vscode from 'vscode';

export interface WebFormatterSettings {
    adornments: string;
    insertFinalNewline: boolean;
    maxConsecutiveBlankLines: number;
    normalizeSectionSpacing: boolean;
    normalizeSectionUnderlines: boolean;
    trimTrailingWhitespace: boolean;
}

export interface WebLintResult {
    stdout: string;
    stderr: string;
    code: number;
}

interface PendingRequest {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
}

function workerSource(pyodideBase: string, wheelsBase: string): string {
    return `
let pyodide = null;
let initPromise = null;
const manifestUrl = ${JSON.stringify(`${wheelsBase}/manifest.json`)};
const wheelsBaseUrl = ${JSON.stringify(wheelsBase)};

function init() {
    if (!initPromise) {
        initPromise = (async () => {
            importScripts(${JSON.stringify(`${pyodideBase}/pyodide.js`)});
            pyodide = await loadPyodide({
                indexURL: ${JSON.stringify(`${pyodideBase}/`)},
            });
            await pyodide.loadPackage([
                'micropip',
                'docutils',
                'pygments',
                'packaging',
                'pydantic',
                'pydantic-core',
            ]);
            const wheelNames = await (await fetch(manifestUrl)).json();
            const micropip = pyodide.pyimport('micropip');
            await micropip.install(wheelNames.map(name => wheelsBaseUrl + '/' + name));
        })();
    }
    return initPromise;
}

function format(payload) {
    pyodide.globals.set('rst_text', payload.text);
    pyodide.globals.set('rst_settings', JSON.stringify(payload.settings));
    return pyodide.runPython(\`
import json
from rstformat.formatter import FormatterSettings, format_restructuredtext

settings = FormatterSettings(**json.loads(rst_settings))
format_restructuredtext(rst_text, settings)
\`);
}

function lint(payload) {
    pyodide.globals.set('lint_tool', payload.tool);
    pyodide.globals.set('lint_text', payload.text);
    pyodide.globals.set('lint_args', JSON.stringify(payload.args || []));
    return pyodide.runPython(\`
import contextlib
import io
import json
import os
import sys

tool = lint_tool
text = lint_text
extra = json.loads(lint_args)

os.makedirs('/tmp/rst-web', exist_ok=True)
path = '/tmp/rst-web/input.rst'
with open(path, 'w', encoding='utf-8') as handle:
    handle.write(text)

stdout = io.StringIO()
stderr = io.StringIO()
code = 0
sys.argv = [tool, path] + extra
try:
    with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
        if tool == 'doc8':
            from doc8.main import main
            main()
        elif tool == 'rst-lint':
            from restructuredtext_lint.cli import LEVEL_MAP, _main

            output_format = 'text'
            level = LEVEL_MAP['warning']
            rst_prolog = None
            index = 0
            while index < len(extra):
                arg = extra[index]
                if arg == '--format' and index + 1 < len(extra):
                    output_format = extra[index + 1]
                    index += 2
                    continue
                if arg.startswith('--format='):
                    output_format = arg.split('=', 1)[1]
                elif arg == '--level' and index + 1 < len(extra):
                    level = LEVEL_MAP.get(extra[index + 1], level)
                    index += 2
                    continue
                elif arg.startswith('--level='):
                    level = LEVEL_MAP.get(arg.split('=', 1)[1], level)
                elif arg == '--rst-prolog' and index + 1 < len(extra):
                    rst_prolog = extra[index + 1]
                    index += 2
                    continue
                elif arg.startswith('--rst-prolog='):
                    rst_prolog = arg.split('=', 1)[1]
                index += 1

            kwargs = {}
            if rst_prolog is not None:
                kwargs['rst_prolog'] = rst_prolog
            _main(
                [path],
                format=output_format,
                stream=stdout,
                level=level,
                **kwargs
            )
        elif tool == 'rstcheck':
            from rstcheck._cli import main
            main()
        else:
            raise ValueError(f'Unsupported linter: {tool}')
except SystemExit as exc:
    code = exc.code if isinstance(exc.code, int) else (0 if exc.code is None else 1)

json.dumps({'stdout': stdout.getvalue(), 'stderr': stderr.getvalue(), 'code': code})
\`);
}

self.onmessage = async event => {
    const {id, method, payload} = event.data;
    try {
        await init();
        let result;
        if (method === 'format') {
            result = format(payload);
        } else if (method === 'lint') {
            result = lint(payload);
        } else {
            result = null;
        }
        self.postMessage({id, ok: true, result});
    } catch (error) {
        self.postMessage({
            id,
            ok: false,
            error: String((error && error.stack) || error),
        });
    }
};
`;
}

export class WebPythonService {
    private worker: Worker | undefined;
    private workerUrl: string | undefined;
    private nextId = 1;
    private pending = new Map<number, PendingRequest>();
    private ready: Promise<void> | undefined;

    public constructor(private readonly extensionUri: vscode.Uri) {}

    public ensureReady(): Promise<void> {
        if (!this.ready) {
            this.ready = this.requestWithTimeout<void>(
                'init',
                {},
                120000
            ).catch(error => {
                this.ready = undefined;
                throw error;
            });
            void vscode.window.setStatusBarMessage(
                'Loading reStructuredText Python runtime...',
                this.ready
            );
        }
        return this.ready;
    }

    public async format(
        text: string,
        settings: WebFormatterSettings
    ): Promise<string> {
        await this.ensureReady();
        return this.request<string>('format', {
            text,
            settings: {
                adornments: settings.adornments,
                insert_final_newline: settings.insertFinalNewline,
                max_consecutive_blank_lines: settings.maxConsecutiveBlankLines,
                normalize_section_spacing: settings.normalizeSectionSpacing,
                normalize_section_underlines:
                    settings.normalizeSectionUnderlines,
                trim_trailing_whitespace: settings.trimTrailingWhitespace,
            },
        });
    }

    public async lint(
        tool: string,
        text: string,
        args: string[] = []
    ): Promise<WebLintResult> {
        await this.ensureReady();
        const result = await this.request<string>('lint', {tool, text, args});
        return JSON.parse(result) as WebLintResult;
    }

    public dispose(): void {
        this.worker?.terminate();
        this.worker = undefined;
        if (this.workerUrl) {
            URL.revokeObjectURL(this.workerUrl);
            this.workerUrl = undefined;
        }
        this.ready = undefined;
        for (const pending of this.pending.values()) {
            pending.reject(new Error('The web Python service was disposed.'));
        }
        this.pending.clear();
    }

    private ensureWorker(): Worker {
        if (this.worker) {
            return this.worker;
        }

        const root = this.extensionUri.toString().replace(/\/$/, '');
        const pyodideBase = `${root}/dist/web/pyodide`;
        const wheelsBase = `${root}/dist/web/wheels`;
        const source = workerSource(pyodideBase, wheelsBase);
        const url = URL.createObjectURL(
            new Blob([source], {type: 'text/javascript'})
        );
        const worker = new Worker(url);
        this.workerUrl = url;

        worker.onmessage = event => {
            const {id, ok, result, error} = event.data;
            const pending = this.pending.get(id);
            if (!pending) {
                return;
            }
            this.pending.delete(id);
            if (ok) {
                pending.resolve(result);
            } else {
                pending.reject(new Error(error));
            }
        };
        worker.onerror = event => {
            const error = new Error(event.message);
            for (const pending of this.pending.values()) {
                pending.reject(error);
            }
            this.pending.clear();
            this.worker = undefined;
            this.ready = undefined;
        };

        this.worker = worker;
        return worker;
    }

    private requestWithTimeout<T>(
        method: string,
        payload: unknown,
        timeoutMs: number
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(
                    new Error(
                        'Timed out while loading the bundled Python runtime.'
                    )
                );
            }, timeoutMs);
            this.request<T>(method, payload).then(
                value => {
                    clearTimeout(timer);
                    resolve(value);
                },
                error => {
                    clearTimeout(timer);
                    reject(error);
                }
            );
        });
    }

    private request<T>(method: string, payload: unknown): Promise<T> {
        const worker = this.ensureWorker();
        const id = this.nextId++;
        return new Promise<T>((resolve, reject) => {
            this.pending.set(id, {
                resolve: value => resolve(value as T),
                reject,
            });
            worker.postMessage({id, method, payload});
        });
    }
}

let service: WebPythonService | undefined;

export function initializeWebPython(extensionUri: vscode.Uri): void {
    service = new WebPythonService(extensionUri);
}

export function getWebPythonService(): WebPythonService {
    if (!service) {
        throw new Error('The web Python service has not been initialized.');
    }
    return service;
}
