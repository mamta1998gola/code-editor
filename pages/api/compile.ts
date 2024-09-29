import { NextApiRequest, NextApiResponse } from 'next';
import vm from 'vm';
import { PythonShell, Options } from 'python-shell';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, language } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: 'Missing "code" or "language" property' });
    }

    if (language !== 'javascript' && language !== 'python') {
        return res.status(400).json({ error: 'Unsupported language' });
    }

    try {
        let result: string;

        if (language === 'javascript') {
            result = await executeJavaScript(code);
        } else {
            result = await executePython(code);
        }

        res.status(200).json({ result });
    } catch (error) {
        console.error('Code execution error:', error);
        res.status(500).json({ error: 'Code execution failed' });
    }
}

async function executeJavaScript(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const sandbox: {
            console: {
                log: (...args: unknown[]) => void;
            };
            output?: string;
        } = {
            console: {
                log: (...args: unknown[]) => {
                    if (!sandbox.output) {
                        sandbox.output = '';
                    }
                    sandbox.output += args.map(arg => JSON.stringify(arg)).join(' ') + '\n';
                },
            },
        };

        const context = vm.createContext(sandbox);
        const wrappedCode = `(() => { ${code} })();`;

        try {
            vm.runInContext(wrappedCode, context);
            resolve(sandbox.output ?? 'No console output');
        } catch (error) {
            reject(new Error(`Some error occured: ${error}`));
        }
    });
}

async function executePython(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const options: Options = {
            mode: 'text',
            pythonOptions: ['-u'], // unbuffered stdout and stderr
        };

        PythonShell.runString(code, options)
            .then((results: string[]) => {
                resolve(results.length > 0 ? results.join('\n') : 'No output');
            })
            .catch((err) => {
                reject(new Error(err));
            });
    });
}
