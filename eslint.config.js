// ESLint 9 flat config.
// Type-aware rules are scoped to src/** via the `files` field; top-level config
// files (eslint.config.js, vitest.config.ts) only get non-type-aware checks.
// Style rules are delegated to Prettier via eslint-config-prettier (last entry).

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
	{
		ignores: ['node_modules/**', 'index.js', '**/*.d.ts', '.git-hooks/**', 'extension/**', 'strategy/**']
	},
	js.configs.recommended,
	{
		files: ['src/**/*.{ts,tsx}'],
		extends: [
			...tseslint.configs.strictTypeChecked,
			...tseslint.configs.stylisticTypeChecked
		],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			},
			globals: {
				...globals.browser
			}
		},
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooks
		},
		settings: {
			react: { version: '18.2' }
		},
		rules: {
			...reactPlugin.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ fixStyle: 'inline-type-imports' }
			],
			// Keep the team's preferred `type` style for domain models (union types
			// are central to types.ts); don't force interface conversion.
			'@typescript-eslint/consistent-type-definitions': 'off',
			// Numbers in template strings are idiomatic for byte/size/index formatting.
			'@typescript-eslint/restrict-template-expressions': [
				'error',
				{ allowNumber: true }
			]
		}
	},
	{
		files: ['src/**/__tests__/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
		rules: {
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-unused-expressions': 'off'
		}
	},
	{
		files: ['*.{js,ts,mjs,cjs}', '*.config.{js,ts,mjs,cjs}'],
		languageOptions: {
			globals: {
				...globals.node
			}
		}
	},
	prettier
);
