const { execSync } = require('child_process');
const fs = require('fs');

const SECRET_PATTERNS = [
    /AIza[0-9A-Za-z-_]{35}/, // Google API Key
    /sk-[a-zA-Z0-9]{48}/,    // OpenAI-style (checks for long random strings starting with sk-)
    /(?:BYTEPLUS|GOOGLE)_API_KEY\s*=\s*['"][a-zA-Z0-9_\-]+['"]/, // Hardcoded assignment
];

try {
    // Check if we are in a git repo
    try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    } catch (e) {
        console.log('Not a git repository, skipping secret check.');
        process.exit(0);
    }

    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
        .split('\n')
        .filter(Boolean);

    let foundSecrets = false;

    stagedFiles.forEach(file => {
        if (!fs.existsSync(file)) return;
        const stats = fs.statSync(file);
        if (!stats.isFile()) return;

        // Skip lock files, images, binaries -> focus on code
        if (file.match(/\.(lock|png|jpg|jpeg|gif|ico|webp|pdf|bin|node)$/i)) return;

        const content = fs.readFileSync(file, 'utf-8');
        SECRET_PATTERNS.forEach(pattern => {
            if (pattern.test(content)) {
                console.error(`\x1b[31m[SECURITY] Potential secret found in ${file} matching pattern ${pattern}\x1b[0m`);
                foundSecrets = true;
            }
        });
    });

    if (foundSecrets) {
        console.error('\x1b[31m[SECURITY] Commit blocked due to potential secrets. Please remove them and try again.\x1b[0m');
        process.exit(1);
    } else {
        console.log('\x1b[32m[SECURITY] No secrets found in staged files.\x1b[0m');
    }
} catch (e) {
    console.warn('[SECURITY] Warning: Could not run secret check:', e.message);
    // Fail safe or open? Let's fail open but warn.
    process.exit(0);
}
