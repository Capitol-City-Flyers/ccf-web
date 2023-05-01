/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/main/webpack/CcfApp.tsx",
        "./src/main/webpack/pages/**/*.{ts,tsx}",
        "./src/main/webpack/components/**/*.{ts,tsx}"
    ],
    theme: {
        extend: {},
    },
    variants: {
        extend: {}
    },
    plugins: [
        require("daisyui")
    ],
}
