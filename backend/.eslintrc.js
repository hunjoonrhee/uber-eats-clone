module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  root: true,
  env: {
    node: true,
    jest: true
  },
  ignorePatterns: ['.eslintrc.js'],
  "rules": {
    "no-return-await": "error",
    "@typescript-eslint/no-shadow": "off",
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/no-explicit-any": "off",
    "prettier/prettier": [
        "error",
        {
            "endOfLine": "lf",
            "jsxBracketSameLine": true,
            "bracketSpacing": false,
            "tabWidth": 4,
            "singleQuote": true,
            "trailingComma": "es5",
            "arrowParens": "avoid",
            "printWidth": 140
        }
    ]
},
"ignorePatterns": [".eslintrc.js", "**/node_modules", "**/dist"]
};
