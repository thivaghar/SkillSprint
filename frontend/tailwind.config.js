/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Custom color palette: orange, sage, black, vintage, warm
                orange: {
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    200: '#FED7AA',
                    300: '#FDBA74',
                    400: '#FB923C',
                    500: '#F97316',
                    600: '#EA580C',
                    700: '#C2410C',
                    800: '#9A3412',
                    900: '#7C2D12',
                },
                sage: {
                    50: '#F6F7F5',
                    100: '#EDF1ED',
                    200: '#D8E2D8',
                    300: '#B8CFBA',
                    400: '#8FB392',
                    500: '#6B9970',
                    600: '#547D5A',
                    700: '#3D5D42',
                    800: '#2D462E',
                    900: '#1F3224',
                },
                vintage: {
                    50: '#FCF9F6',
                    100: '#F9F3ED',
                    200: '#F0E5DA',
                    300: '#E0CFC0',
                    400: '#CDB39F',
                    500: '#B89A7E',
                    600: '#9B7E65',
                    700: '#7D6550',
                    800: '#5F4D3D',
                    900: '#46362A',
                },
                warm: {
                    50: '#FEF7F0',
                    100: '#FEEAE0',
                    200: '#FDD4BE',
                    300: '#FCB89C',
                    400: '#F9926D',
                    500: '#F5714A',
                    600: '#E8542D',
                    700: '#D43A1F',
                    800: '#A62D18',
                    900: '#7F1F0F',
                },
            }
        },
    },
    plugins: [],
}
