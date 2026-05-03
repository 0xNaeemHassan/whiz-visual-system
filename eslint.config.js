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
          { test: /\/src\/components\//, regex: /^(?:[A-Z][A-Za-z0-9]*\.jsx|[a-z][A-Za-z0-9]*\.js|primitives\.jsx)$/, msg: 'Component view files must be PascalCase .jsx; component utility modules must be lowerCamelCase .js.' },
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

    'service-symbol-naming': {
      meta: { type: 'problem' },
      create(context) {
        const rel = context.filename.replace(/\\/g, '/');
        if (!/\/src\/domain\/services\//.test(rel)) return {};
        return {
          'FunctionDeclaration[id.name!=null]'(node) {
            if (!/^[a-z][A-Za-z0-9]*$/.test(node.id.name)) {
              context.report({ node: node.id, message: 'Service functions must use lowerCamelCase names.' });
            }
          },
        };
      },
    },
    'comment-prefix-convention': {
      meta: { type: 'problem' },
      create(context) {
        const sourceCode = context.sourceCode;
        const rel = context.filename.replace(/\\/g, '/');
        if (!/\/src\/pages\/Editor\.jsx$/.test(rel) && !/\/src\/domain\/services\//.test(rel)) return {};
        return {
          Program(node) {
            const comments = sourceCode.getAllComments();
            comments.forEach((comment) => {
              const text = comment.value.trim();
              if (/^(Fix\s*#|P\d+-\d+|C-\d+)/.test(text)) {
                context.report({ node: comment, message: 'Use comment prefixes like NOTE:, TODO:, or FIXME: instead of legacy patch labels.' });
              }
            });
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
      'naming/service-symbol-naming': 'error',
      'naming/comment-prefix-convention': 'error',
    },
  },
];
