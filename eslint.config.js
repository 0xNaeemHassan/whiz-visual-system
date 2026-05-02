import js from '@eslint/js';
import globals from 'globals';
import path from 'node:path';

const namingRules = {
  rules: {
    'file-naming-convention': {
      meta: { type: 'problem' },
      create(context) {
        const filename = context.filename;
        const base = path.basename(filename);
        const rel = filename.replace(/\\/g, '/');
        const checks = [
          { test: /\/src\/components\//, regex: /^[A-Z][A-Za-z0-9]*\.jsx$/, msg: 'Component files in src/components must be PascalCase .jsx files.' },
          { test: /\/src\/pages\//, regex: /^[A-Z][A-Za-z0-9]*\.jsx$/, msg: 'Page files in src/pages must be PascalCase .jsx files.' },
          { test: /\/src\/hooks\//, regex: /^use[A-Z][A-Za-z0-9]*\.js$/, msg: 'Hook files in src/hooks must be named useXxx.js.' },
          { test: /\/src\/data\//, regex: /^[a-z][A-Za-z0-9]*\.js$/, msg: 'Data module files in src/data must be lowerCamelCase .js files.' },
        ];
        return {
          Program(node) {
            for (const { test, regex, msg } of checks) {
              if (test.test(rel) && !regex.test(base)) {
                context.report({ node, message: msg });
              }
            }
          },
        };
      },
    },
    'hook-api-naming': {
      meta: { type: 'problem' },
      create(context) {
        const rel = context.filename.replace(/\\/g, '/');
        if (!/\/src\/hooks\//.test(rel)) return {};
        return {
          ExportNamedDeclaration(node) {
            const decl = node.declaration;
            if (decl?.type === 'FunctionDeclaration' && !/^use[A-Z]/.test(decl.id?.name || '')) {
              context.report({ node: decl.id || node, message: 'Exported hook APIs must start with useXxx.' });
            }
          },
        };
      },
    },
  },
};

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { naming: namingRules },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-empty': 'off',
      'naming/file-naming-convention': 'error',
      'naming/hook-api-naming': 'error',
    },
  },
];
