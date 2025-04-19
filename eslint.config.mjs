import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import perfectionist from 'eslint-plugin-perfectionist';
import prettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    plugins: { prettier, perfectionist },
    languageOptions: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      parser: tsParser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.mjs', '*.js'],
          defaultProject: 'tsconfig.json'
        },
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          destructuredArrayIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false
        }
      ],
      'perfectionist/sort-named-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc'
        }
      ],
      'perfectionist/sort-interfaces': [
        'error',
        {
          type: 'natural',
          order: 'asc'
        }
      ],
      'no-console': [
        'error',
        {
          allow: ['warn', 'error']
        }
      ]
    }
  }
);
