# react-project-blank

Blank for React projects, based on gulp4

## Usage

- Clone or download this repo
- Run `cd path/to/your/folder/with/this/project`
- Run `npm install`
- Run `gulp` to start development

## Configure VS Code

For lint scripts and styles with auto format on file save, install Prettier, Stylelint and ESLint extensions of VS Code and put this settings in your `settings.json`

    "css.validate": false,
    "scss.validate": false,
    "prettier.stylelintIntegration": true,
    "eslint.enable": true,
    "eslint.options": {
      "configFile": ".eslintrc.json"
    },
    "prettier.eslintIntegration": true,
    "eslint.autoFixOnSave": false,
    "editor.formatOnSave": true
