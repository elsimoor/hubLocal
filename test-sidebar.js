// Save as test-sidebar.js and run with `node test-sidebar.js`
// This script will:
// 1. Fetch a CSRF token from NextAuth
// 2. Sign in using the Credentials provider (email+password)
// 3. Capture the session cookie returned by NextAuth
// 4. Call POST /api/custom-components to create a sidebar component
//
// Prerequisites:
// - Next.js dev server running locally on port 3000 (`npm run dev`)
// - An existing user account (register via your signup flow or seed manually)
// - NEXTAUTH_SECRET set in .env
// - (Optional) OPENAI_API_KEY set if you want AI generation instead of fallback templates
//
// Configure credentials via environment variables or pass as CLI args:
//   set TEST_EMAIL=me@example.com
//   set TEST_PASSWORD=yourPassword123
// Or: node test-sidebar.js me@example.com yourPassword123
//
// If authentication fails you'll see the raw error response for easier debugging.

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function getCredentialsFromEnvOrArgs() {
    const [, , argEmail, argPassword] = process.argv;
    const email = argEmail || process.env.TEST_EMAIL;
    const password = argPassword || process.env.TEST_PASSWORD;
    if (!email || !password) {
        throw new Error('Missing credentials. Provide TEST_EMAIL & TEST_PASSWORD env vars or CLI args: node test-sidebar.js email password');
    }
    return { email, password };
}

async function fetchCsrfToken() {
    const res = await fetch(`${BASE_URL}/api/auth/csrf`, { redirect: 'manual' });
    if (!res.ok) throw new Error(`Failed to get CSRF token: ${res.status}`);
    const data = await res.json();
    if (!data?.csrfToken) throw new Error('No csrfToken in response');
    // Capture any cookies (e.g. next-auth.csrf-token) to send back on credential sign-in
    const setCookie = res.headers.get('set-cookie') || '';
    const csrfCookie = setCookie.match(/(?:__Secure-)?next-auth\.csrf-token=[^;]+/);
    return { csrfToken: data.csrfToken, csrfSetCookie: csrfCookie ? csrfCookie[0] : null };
}

// Perform credentials sign-in to obtain session cookie.
async function signInCredentials(email, password) {
    const { csrfToken, csrfSetCookie } = await fetchCsrfToken();
    const body = new URLSearchParams({
        csrfToken,
        email,
        password,
        callbackUrl: `${BASE_URL}/`,
        json: 'true'
    }).toString();
    const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // Forward CSRF cookie if present (required by NextAuth for credentials sign-in)
            ...(csrfSetCookie ? { 'Cookie': csrfSetCookie } : {})
        },
        body
    });
        if (!res.ok) {
            const text = await res.text();
            console.error('Headers on failed sign-in:', Object.fromEntries(res.headers.entries()));
            throw new Error(`Sign-in failed (${res.status}): ${text}`);
        }
    // NextAuth returns one or more Set-Cookie headers containing the session token.
    // In Node's fetch, multiple cookies might be concatenated. We extract the session token cookie.
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) {
        console.error('Headers (no set-cookie):', Object.fromEntries(res.headers.entries()));
        throw new Error('No Set-Cookie header returned from credentials sign-in');
    }
    // Possible cookie names: next-auth.session-token or __Secure-next-auth.session-token
    const match = setCookie.match(/(?:__Secure-)?next-auth\.session-token=[^;]+/);
    if (!match) {
        console.error('Raw Set-Cookie value:', setCookie);
        throw new Error('Session token cookie not found in Set-Cookie header');
    }
    return match[0]; // Return the cookie string e.g. next-auth.session-token=abc123
}

    async function trySignup(email, password) {
        const res = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            // If email is taken that's fine for our flow; any other error we surface
            const data = await res.json().catch(() => ({}));
            if (data?.error && data.error !== 'email_taken') {
                throw new Error(`Signup failed (${res.status}): ${JSON.stringify(data)}`);
            }
        }
    }

async function createSidebarComponent(sessionCookie) {
    const payload = {
        name: 'Sidebar',
        prompt: 'Build a sidebar for navigating between dashboard pages.',
        public: false,
        // You can pass options to influence template type if AI is off
        // options: { platform: 'link', label: 'Go', href: 'https://example.com' }
    };
    const res = await fetch(`${BASE_URL}/api/custom-components`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Create component failed (${res.status}): ${text}`);
    }
    return res.json();
}

async function main() {
    try {
        const { email, password } = getCredentialsFromEnvOrArgs();
        console.log('Signing in as', email);
            let sessionCookie;
            try {
                sessionCookie = await signInCredentials(email, password);
            } catch (e) {
                console.log('Sign-in failed, attempting to sign up this user, then retry...');
                await trySignup(email, password);
                sessionCookie = await signInCredentials(email, password);
            }
        console.log('Obtained session cookie:', sessionCookie.split('=')[0] + '=<redacted>');
        console.log('Creating sidebar component...');
        const result = await createSidebarComponent(sessionCookie);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
        process.exitCode = 1;
    }
}

main();
