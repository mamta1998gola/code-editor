'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { OnMount } from '@monaco-editor/react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => <div>Loading editor...</div>,
});

interface Language {
    id: string;
    label: string;
}

const languages: Language[] = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    // Add more languages as needed
];

const EditorPage: React.FC = () => {
    const [code, setCode] = useState<string>('');
    const [language, setLanguage] = useState<string>('javascript');
    const [compilerOutput, setCompilerOutput] = useState<string>('');
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const [error, setError] = useState<null | string>(null);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;
    };

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(event.target.value);
    };

    const handleCompile = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await fetch('/api/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setCompilerOutput(data.result);
        } catch (err) {
            console.error('Error compiling code:', err);
            setError('An error occurred while compiling the code.');
        }
    };

    return (
        <div className="flex h-screen">
            <div className="w-1/2 h-full p-4 flex flex-col">
                <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="mb-2 p-2 border rounded"
                >
                    {languages.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                            {lang.label}
                        </option>
                    ))}
                </select>
                <MonacoEditor
                    height="90%"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value ?? '')}
                    onMount={handleEditorDidMount}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                    }}
                />
            </div>
            <div className="w-1/2 h-full p-4 flex flex-col">
                <button
                    onClick={(e) => handleCompile(e)}
                    className="mb-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Compile
                </button>
                <pre className="flex-1 p-2 bg-gray-100 rounded overflow-auto">
                    {error ?? compilerOutput}
                </pre>
            </div>
        </div>
    );
};

export default EditorPage;
