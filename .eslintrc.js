module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "settings": {
    "react": {
      "version": "detect",
    },
  },
  "plugins": [
    "@typescript-eslint",
  ],
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/member-delimiter-style": ["error", {
      "multiline": {
        "delimiter": "semi",
        "requireLast": true
      },
      "singleline": {
        "delimiter": "comma",
        "requireLast": false
      }
    }],
    "@typescript-eslint/no-unused-vars": ["warn", {
      "vars": "all",
      "args": "after-used",
      "ignoreRestSiblings": true,
      "argsIgnorePattern": "^_",
    }],

    "react/display-name": "off",
    "react/no-unescaped-entities": "off",
    "react/jsx-tag-spacing": ["error", {
      "closingSlash": "never",
      "beforeSelfClosing": "always",
      "afterOpening": "never",
      "beforeClosing": "never"
    }],
    "react/jsx-boolean-value": ["error", "never"],
    "react/jsx-curly-spacing": ["error", { "when": "never", "children": true }],
    "react/jsx-equals-spacing": ["error", "never"],
    "react/jsx-indent-props": ["error", 2],
    "react/jsx-curly-brace-presence": ["error", "never"],
    "react/jsx-key": ["error", { "checkFragmentShorthand": true }],
    "react/jsx-indent": ["error", 2, { checkAttributes: true, indentLogicalExpressions: true }],

    "quotes": "off",
    "@typescript-eslint/quotes": ["error", "single", { "allowTemplateLiterals": true, "avoidEscape": true }],
    "semi": "off",
    "@typescript-eslint/semi": ["error", "always", { "omitLastInOneLineBlock": true }],
    "comma-dangle": ["error", {
      "arrays": "always-multiline",
      "objects": "always-multiline",
      "imports": "always-multiline",
      "exports": "always-multiline",
      "functions": "never"
    }],
    "comma-spacing": ["error"],
    "eqeqeq": ["error", "smart"],
    "indent": "off",
    "@typescript-eslint/indent": ["error", 2, {
      "SwitchCase": 1,
    }],
    "no-multi-spaces": "error",
    "object-curly-spacing": ["error", "always"],
    "arrow-parens": "error",
    "arrow-spacing": "error",
    "key-spacing": "error",
    "keyword-spacing": "error",
    "func-call-spacing": "off",
    "@typescript-eslint/func-call-spacing": ["error"],
    "space-before-function-paren": ["error", {
        "anonymous": "always",
        "named": "never",
        "asyncArrow": "always"
    }],
    "space-in-parens": ["error", "never"],
    "space-before-blocks": "error",
    "curly": ["error", "all"],
    "space-infix-ops": "error",
    "consistent-return": "error",
    "jsx-quotes": ["error"],
    "array-bracket-spacing": "error",
    "brace-style": "off",
    "@typescript-eslint/brace-style": [
      "error",
      "1tbs",
      { allowSingleLine: true },
    ],
    "no-useless-constructor": "off",
    "@typescript-eslint/no-useless-constructor": "warn",
  }
};
