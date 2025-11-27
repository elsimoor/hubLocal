const fs = require("fs");
const path = require("path");

const puckConfigPath = path.resolve(__dirname, "src/lib/puck/config.tsx");

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function readPuckConfigForTailwind() {
  const attempts = 5;
  for (let i = 0; i < attempts; i++) {
    try {
      return fs.readFileSync(puckConfigPath, "utf8");
    } catch (error) {
      if (error.code !== "EBUSY") {
        console.warn(`[tailwind] Failed to read puck config: ${error.message}`);
        return "";
      }
      if (i === attempts - 1) {
        console.warn("[tailwind] Puck config locked, continuing without it.");
        return "";
      }
      sleep(25);
    }
  }
  return "";
}

const puckConfigRaw = readPuckConfigForTailwind();

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "!./src/lib/puck/config.tsx",
    ...(puckConfigRaw
      ? [{ raw: puckConfigRaw, extension: "tsx" }]
      : []),
  ],
  theme: {
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			ring: 'hsl(var(--ring))',
  			'chart-1': 'var(--chart-1)',
  			'chart-2': 'var(--chart-2)',
  			'chart-3': 'var(--chart-3)',
  			'chart-4': 'var(--chart-4)',
  			'chart-5': 'var(--chart-5)',
  			sidebar: {
  				DEFAULT: 'var(--sidebar)',
  				foreground: 'var(--sidebar-foreground)',
  				primary: 'var(--sidebar-primary)',
  				'primary-foreground': 'var(--sidebar-primary-foreground)',
  				accent: 'var(--sidebar-accent)',
  				'accent-foreground': 'var(--sidebar-accent-foreground)',
  				border: 'var(--sidebar-border)',
  				ring: 'var(--sidebar-ring)'
  			},
  			input: 'hsl(var(--input))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		keyframes: {
  			float: {
  				'0%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-12px)'
  				},
  				'100%': {
  					transform: 'translateY(0)'
  				}
  			}
  		},
  		animation: {
  			float: 'float 14s ease-in-out infinite'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
