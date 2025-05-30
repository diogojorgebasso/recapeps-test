// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import eslintPluginStorybook from "eslint-plugin-storybook";

import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
})

const eslintConfig = [...compat.config({
    extends: ['next'],
    settings: {
        next: {
            rootDir: 'src/app/',
        },
    },
}), ...eslintPluginStorybook.configs["flat/recommended"]]

export default eslintConfig