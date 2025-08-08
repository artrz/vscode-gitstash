module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "ignorePatterns": [".eslintrc.js"],
    "parserOptions": {
        "project": ["./tsconfig.json"],
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    "rules": {
        "@typescript-eslint/adjacent-overload-signatures": "warn",
        "@typescript-eslint/array-type": [
            "warn",
            {
                "default": "array"
            }
        ],
        "@typescript-eslint/naming-convention": [
            "warn",
            {
                "selector": "enumMember",
                "format": ["PascalCase"]
            }
        ],
        "@typescript-eslint/consistent-type-assertions": "warn",
        "@typescript-eslint/consistent-type-definitions": "warn",
        "@typescript-eslint/no-inferrable-types": "warn",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/prefer-for-of": "warn",
        "@typescript-eslint/prefer-namespace-keyword": "warn",
        "@typescript-eslint/triple-slash-reference": "warn",
        "arrow-body-style": "warn",
        "arrow-parens": [
            "warn",
            "always"
        ],
        "brace-style": [
            "warn",
            "stroustrup"
        ],
        "camelcase": "warn",
        "comma-dangle": [
            "warn",
            "always-multiline"
        ],
        "curly": [
            "warn",
            "multi-line"
        ],
        "eqeqeq": [
            "warn",
            "smart"
        ],
        "id-match": "warn",
        "sort-imports": "warn",
        "new-parens": "warn",
        "no-eval": "warn",
        "no-irregular-whitespace": "warn",
        "no-multiple-empty-lines": [
            "warn",
            {
                "max": 1
            }
        ],
        "no-redeclare": "warn",
        "no-throw-literal": "warn",
        "no-trailing-spaces": "warn",
        "no-unsafe-finally": "warn",
        "no-var": "warn",
        "one-var": [
            "warn",
            "never"
        ],
        "prefer-const": "warn",
        "prefer-template": "warn",
        "quote-props": [
            "warn",
            "as-needed"
        ],
        "radix": "warn",
        "space-before-function-paren": [
            "warn",
            {
                "anonymous": "never",
                "named": "never",
                "asyncArrow": "always"
            }
        ],
        "spaced-comment": [
            "warn",
            "always",
            {
                "markers": [
                    "/"
                ]
            }
        ],
        "use-isnan": "warn"
    }
};
