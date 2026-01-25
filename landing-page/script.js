/**
 * PluralConnect Landing Page - JavaScript
 * 
 * Features:
 * - Real-time Firebase counter for signups
 * - Email form with duplicate detection
 * - Automatic early bird reward calculation
 * - Particle animations
 * - Smooth interactions
 * - ✅ Anti-spam: Honeypot + Rate limiting
 */

// ==================== CONSTANTS ====================
const MAX_EARLY_BIRD = 500;
const FIRST_100 = 100;
const MIN_SUBMIT_INTERVAL = 2000; // 2 seconds between submissions
const REWARDS = {
    // Récompenses 500 premiers (Early Bird)
    PIONEER_THEME: { name: 'Thème Pioneer Exclusif', icon: '🎨', tier: 500 },
    CREDITS_500: { name: '500 Crédits Bonus', icon: '💎', tier: 500 },
    BADGE_PIONEER: { name: 'Badge Pioneer Permanent', icon: '⭐', tier: 500 },
    // Récompenses 100 premiers (Double Bonus)
    DOUBLE_CREDITS: { name: '1000 Crédits (Double!)', icon: '💎💎', tier: 100 },
    BADGE_FIRST_100: { name: 'Badge "First 100"', icon: '🏆', tier: 100 },
    EXCLUSIVE_THEME: { name: 'Thème Exclusif First 100', icon: '🎨✨', tier: 100 },
    BETA_ACCESS: { name: 'Accès Alpha Privé', icon: '🚀', tier: 100 }
};

// ==================== STATE ====================
let signupCount = 0;
let isFirebaseReady = false;
let db = null;
let lastSubmitTime = 0; // For rate limiting

// ==================== FIREBASE INITIALIZATION ====================
function waitForFirebase() {
    return new Promise((resolve) => {
        const check = () => {
            if (window.firebaseDB && window.firebaseUtils) {
                db = window.firebaseDB;
                isFirebaseReady = true;
                resolve(true);
            } else {
                setTimeout(check, 100);
            }
        };
        check();

        // Timeout after 5s
        setTimeout(() => {
            if (!isFirebaseReady) {
                console.warn('Firebase not available, using fallback');
                resolve(false);
            }
        }, 5000);
    });
}

// ==================== REAL-TIME COUNTER ====================
async function initRealTimeCounter() {
    await waitForFirebase();

    if (!isFirebaseReady) {
        // Fallback: use localStorage count
        const localSignups = JSON.parse(localStorage.getItem('pluralconnect_signups') || '[]');
        signupCount = localSignups.length;
        updateCounterUI(signupCount);
        return;
    }

    const { doc, onSnapshot, setDoc, getDoc } = window.firebaseUtils;

    // Reference to counter document
    const counterRef = doc(db, 'landing_stats', 'signup_counter');

    // Initialize counter if doesn't exist
    try {
        const counterSnap = await getDoc(counterRef);
        if (counterSnap.exists()) {
            signupCount = counterSnap.data().count || 0;
            updateCounterUI(signupCount);
        } else {
            await setDoc(counterRef, { count: 0, lastUpdated: new Date().toISOString() });
            updateCounterUI(0);
        }
    } catch (e) {
        console.error('[Counter Error]', e);
    }

    // Real-time listener for future updates
    onSnapshot(counterRef, (docSnap) => {
        if (docSnap.exists()) {
            signupCount = docSnap.data().count || 0;
            updateCounterUI(signupCount);
        }
    }, (error) => {
        console.error('[Counter Listener Error]', error);
    });
}

function updateCounterUI(count) {
    const spotsLeft = Math.max(0, MAX_EARLY_BIRD - count);
    const progress = Math.min((count / MAX_EARLY_BIRD) * 100, 100);
    const isObjectifAtteint = count >= MAX_EARLY_BIRD;

    // Update all counter elements
    const elements = {
        'signup-count': count.toString(),
        'spots-left': spotsLeft.toString(),
        'spots-left-main': spotsLeft.toString(),
        'spots-badge': spotsLeft.toString()
    };

    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            // Animate the number
            animateValue(el, parseInt(el.textContent) || 0, parseInt(value), 500);
        }
    });

    // Update progress bar
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;

        if (isObjectifAtteint) {
            progressBar.style.background = 'linear-gradient(90deg, #10B981, #34D399)';
        } else if (progress >= 90) {
            progressBar.style.background = 'linear-gradient(90deg, #EF4444, #F59E0B)';
        } else if (progress >= 70) {
            progressBar.style.background = 'linear-gradient(90deg, #F59E0B, #FBBF24)';
        }
    }

    // Update status text
    const statusEl = document.getElementById('counter-status');
    if (statusEl) {
        if (isObjectifAtteint) {
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Objectif atteint ! Inscrivez-vous pour être informé du lancement.';
            statusEl.style.color = '#10B981';
        } else if (spotsLeft <= 50) {
            statusEl.innerHTML = `<i class="fas fa-fire"></i> Plus que ${spotsLeft} places ! Dépêchez-vous !`;
            statusEl.style.color = '#EF4444';
        } else if (spotsLeft <= 100) {
            statusEl.innerHTML = `<i class="fas fa-clock"></i> ${spotsLeft} places Early Bird restantes`;
            statusEl.style.color = '#F59E0B';
        } else {
            statusEl.innerHTML = `<i class="fas fa-circle-check"></i> En temps réel · ${count} inscrits`;
            statusEl.style.color = '#10B981';
        }
    }

    // Update early bird badge visibility
    const badge = document.getElementById('early-bird-badge');
    if (badge) {
        if (isObjectifAtteint) {
            badge.innerHTML = '<i class="fas fa-trophy"></i> Objectif atteint !';
            badge.classList.add('completed');
        }
    }

    // Hide countdown badge when objective reached
    const countdownBadge = document.getElementById('countdown-badge');
    if (countdownBadge && isObjectifAtteint) {
        countdownBadge.innerHTML = '<i class="fas fa-trophy"></i> <span>L\'objectif Early Bird est atteint !</span>';
        countdownBadge.classList.add('completed');
    }

    // Update "Places restantes" label when objective reached
    const spotsLeftItem = document.querySelector('.counter-item.highlight');
    if (spotsLeftItem && isObjectifAtteint) {
        const label = spotsLeftItem.querySelector('.counter-label');
        if (label) {
            label.textContent = 'Complet !';
        }
    }

    // Update form note when objective reached
    const formNote = document.querySelector('.form-note');
    if (formNote && isObjectifAtteint) {
        formNote.innerHTML = '<i class="fas fa-bell"></i> Inscrivez-vous pour être <strong>notifié du lancement</strong> !';
    }

    // Update milestone 100 marker
    const milestone100 = document.getElementById('milestone-100');
    const tier100 = document.getElementById('tier-100');
    const isFirst100Complete = count >= FIRST_100;

    if (milestone100) {
        if (isFirst100Complete) {
            milestone100.classList.add('reached');
        }
    }

    if (tier100) {
        if (isFirst100Complete) {
            tier100.classList.add('completed');
            tier100.querySelector('.tier-text').innerHTML = '<strong>100 premiers</strong> : Complet !';
        } else {
            const spots100Left = FIRST_100 - count;
            tier100.querySelector('.tier-text').innerHTML = `<strong>${spots100Left} places</strong> Double Bonus restantes !`;
        }
    }
}

function animateValue(element, start, end, duration) {
    if (start === end) {
        element.textContent = end;
        return;
    }

    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = end;
        }
    }

    requestAnimationFrame(update);
}

// ==================== MODAL HANDLING ====================
let pendingEmail = '';
let pendingFormId = '';

function openSignupModal(email, formId) {
    pendingEmail = email;
    pendingFormId = formId;

    const modal = document.getElementById('signup-modal');
    const modalEmail = document.getElementById('modal-email');
    const modalPassword = document.getElementById('modal-password');
    const modalPasswordConfirm = document.getElementById('modal-password-confirm');
    const modalError = document.getElementById('modal-error');

    if (modalEmail) modalEmail.value = email;
    if (modalPassword) modalPassword.value = '';
    if (modalPasswordConfirm) modalPasswordConfirm.value = '';
    if (modalError) modalError.classList.add('hidden');

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Focus password field
    setTimeout(() => modalPassword?.focus(), 100);
}

function closeSignupModal() {
    const modal = document.getElementById('signup-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    pendingEmail = '';
    pendingFormId = '';
}

function togglePassword() {
    const passwordInput = document.getElementById('modal-password');
    const toggleBtn = document.querySelector('.toggle-password i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

// ==================== FORM HANDLING ====================
async function handleFormSubmit(event, formId) {
    event.preventDefault();

    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    const submitButton = form.querySelector('button[type="submit"]');
    const email = emailInput.value.trim().toLowerCase();

    // ✅ HONEYPOT CHECK - Silent bot rejection
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value !== '') {
        // Bot detected - silently reject without showing error
        emailInput.value = '';
        return;
    }

    // ✅ RATE LIMITING - Prevent spam submissions
    const now = Date.now();
    if (now - lastSubmitTime < MIN_SUBMIT_INTERVAL) {
        showToast('⏱️ Veuillez attendre 2 secondes entre chaque soumission', 'error');
        shakeInput(emailInput);
        return;
    }

    if (!email || !isValidEmail(email)) {
        showToast('📧 Veuillez entrer une adresse email valide', 'error');
        shakeInput(emailInput);
        return;
    }

    // Update last submit time
    lastSubmitTime = now;

    // Open modal instead of registering directly
    openSignupModal(email, formId);
}

async function handleModalSubmit(event) {
    event.preventDefault();

    const email = pendingEmail;
    const formId = pendingFormId;
    const password = document.getElementById('modal-password').value;
    const passwordConfirm = document.getElementById('modal-password-confirm').value;
    const submitButton = document.querySelector('.btn-modal-submit');
    const errorEl = document.getElementById('modal-error');

    // Validate passwords
    if (password.length < 6) {
        errorEl.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
        errorEl.classList.remove('hidden');
        return;
    }

    if (password !== passwordConfirm) {
        errorEl.textContent = 'Les mots de passe ne correspondent pas';
        errorEl.classList.remove('hidden');
        return;
    }

    errorEl.classList.add('hidden');

    // Disable button
    submitButton.disabled = true;
    const originalContent = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';

    try {
        const result = await registerEmailWithPassword(email, password);

        closeSignupModal();

        // Clear the original form
        const emailInput = document.getElementById(formId === 'hero' ? 'hero-email' : 'main-email');
        if (emailInput) emailInput.value = '';

        if (result.alreadyExists) {
            showAlreadyRegistered(formId, result.position);
        } else {
            showSuccess(formId, result.position);
            updateCounterUI(result.position);
        }

    } catch (error) {
        console.error('Signup error:', error);

        if (error.position) {
            closeSignupModal();
            showAlreadyRegistered(formId, error.position);
        } else {
            errorEl.textContent = error.message || 'Erreur lors de l\'inscription. Réessayez.';
            errorEl.classList.remove('hidden');
        }
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalContent;
    }
}

/**
 * Register user with their chosen password
 */
async function registerEmailWithPassword(email, password) {
    // Save to localStorage first (backup)
    saveToLocalStorage(email);

    if (!isFirebaseReady) {
        return { success: true, position: signupCount + 1, alreadyExists: false };
    }

    const { doc, getDoc, setDoc } = window.firebaseUtils;
    const { createUserWithEmailAndPassword } = window.firebaseAuthUtils;
    const auth = window.firebaseAuth;

    // Create unique key from email
    const emailKey = email.replace(/[.@]/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const signupRef = doc(db, 'early_signups', emailKey);
    const counterRef = doc(db, 'landing_stats', 'signup_counter');

    try {
        // Step 1: Check if email already exists in early_signups
        const existingDoc = await getDoc(signupRef);

        if (existingDoc.exists()) {
            return {
                success: true,
                position: existingDoc.data().position || 0,
                alreadyExists: true
            };
        }

        // Step 2: Get current counter
        const counterSnap = await getDoc(counterRef);
        const currentCount = counterSnap.exists() ? (counterSnap.data().count || 0) : 0;
        const newPosition = currentCount + 1;

        // Step 3: Create Firebase Auth account with user's password
        let uid;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            uid = userCredential.user.uid;
            console.log(`✅ Firebase Auth account created for ${email} (UID: ${uid})`);
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                console.warn(`⚠️ Auth account already exists for ${email}`);
                uid = null;
            } else if (authError.code === 'auth/weak-password') {
                throw new Error('Le mot de passe est trop faible. Utilisez au moins 6 caractères.');
            } else {
                throw authError;
            }
        }

        // Step 4: Save signup data in Firestore
        await setDoc(signupRef, {
            uid: uid || null,
            email: email,
            position: newPosition,
            isFirst100: newPosition <= FIRST_100,
            isEarlyBird: newPosition <= MAX_EARLY_BIRD,
            rewards: calculateRewards(newPosition),
            registeredAt: new Date().toISOString(),
            source: 'landing_page',
            authAccountCreated: !!uid
        });

        // Step 5: Update counter
        await setDoc(counterRef, {
            count: newPosition,
            lastUpdated: new Date().toISOString()
        });

        // Step 6: Update local state
        signupCount = newPosition;

        return { success: true, position: newPosition, alreadyExists: false };

    } catch (error) {
        console.error('[Registration Error]', error);

        if (error.code === 'auth/invalid-email') {
            throw new Error('📧 Adresse email invalide.');
        } else if (error.code === 'auth/email-already-in-use') {
            // Try to find existing position
            const existingDoc = await getDoc(signupRef);
            if (existingDoc.exists()) {
                const position = existingDoc.data().position || 0;
                throw { message: 'Cet email est déjà inscrit !', position };
            }
            throw new Error('Cet email est déjà utilisé.');
        }

        throw error;
    }
}

async function registerEmail(email) {
    // Save to localStorage first (backup)
    saveToLocalStorage(email);

    if (!isFirebaseReady) {
        return { success: true, position: signupCount + 1, alreadyExists: false };
    }

    const { doc, getDoc, setDoc } = window.firebaseUtils;
    const { createUserWithEmailAndPassword, sendPasswordResetEmail } = window.firebaseAuthUtils;
    const auth = window.firebaseAuth;

    // Create unique key from email
    const emailKey = email.replace(/[.@]/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const signupRef = doc(db, 'early_signups', emailKey);
    const counterRef = doc(db, 'landing_stats', 'signup_counter');

    try {
        // Step 1: Check if email already exists in early_signups
        const existingDoc = await getDoc(signupRef);

        if (existingDoc.exists()) {
            return {
                success: true,
                position: existingDoc.data().position || 0,
                alreadyExists: true
            };
        }

        // Step 2: Get current counter
        const counterSnap = await getDoc(counterRef);
        const currentCount = counterSnap.exists() ? (counterSnap.data().count || 0) : 0;
        const newPosition = currentCount + 1;

        // Step 3: Create Firebase Auth account with temporary password
        const tempPassword = generateSecurePassword();
        let uid;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
            uid = userCredential.user.uid;
            console.log(`✅ Firebase Auth account created for ${email} (UID: ${uid})`);
        } catch (authError) {
            // If account already exists in Auth, try to get UID from error or skip
            if (authError.code === 'auth/email-already-in-use') {
                console.warn(`⚠️ Auth account already exists for ${email}`);
                // We'll continue without UID, or you could try to sign in to get UID
                uid = null;
            } else {
                throw authError;
            }
        }

        // Step 4: Send password reset email so user can set their own password
        if (uid) {
            try {
                await sendPasswordResetEmail(auth, email);
                console.log(`📧 Password reset email sent to ${email}`);
            } catch (emailError) {
                console.warn('Failed to send password reset email:', emailError);
                // Continue anyway, user can request reset later
            }
        }

        // Step 5: Save signup data in Firestore
        await setDoc(signupRef, {
            uid: uid || null,
            email: email,
            position: newPosition,
            isEarlyBird: newPosition <= MAX_EARLY_BIRD,
            rewards: calculateRewards(newPosition),
            registeredAt: new Date().toISOString(),
            source: 'landing_page',
            authAccountCreated: !!uid
        });

        // Step 6: Update counter
        await setDoc(counterRef, {
            count: newPosition,
            lastUpdated: new Date().toISOString()
        });

        // Step 7: Update local state
        signupCount = newPosition;

        return { success: true, position: newPosition, alreadyExists: false };

    } catch (error) {
        console.error('[Registration Error]', error);

        // Better error messages based on error type
        if (error.code === 'auth/invalid-email') {
            throw new Error('📧 Adresse email invalide.');
        } else if (error.code === 'auth/email-already-in-use') {
            throw new Error('📧 Un compte existe déjà avec cet email.');
        } else {
            throw new Error('📧 Inscription échouée. Veuillez réessayer.');
        }
    }
}


function calculateRewards(position) {
    const rewards = [];

    // Top 100 get DOUBLE BONUS (replaces normal rewards)
    if (position <= FIRST_100) {
        rewards.push('double_credits', 'badge_first_100', 'exclusive_theme', 'beta_access');
    }
    // 101-500 get normal Early Bird rewards
    else if (position <= MAX_EARLY_BIRD) {
        rewards.push('pioneer_theme', 'credits_500', 'badge_pioneer');
    }

    return rewards;
}

function saveToLocalStorage(email) {
    const signups = JSON.parse(localStorage.getItem('pluralconnect_signups') || '[]');
    if (!signups.includes(email)) {
        signups.push(email);
        localStorage.setItem('pluralconnect_signups', JSON.stringify(signups));
    }
}

/**
 * Strict email validation
 * - RFC 5321 compliant regex (supports plus-addressing like user+tag@example.com)
 * - Blocks disposable email domains
 * - Length validation (min 6, max 254)
 */
function isValidEmail(email) {
    // Length checks (RFC 5321)
    if (email.length < 6 || email.length > 254) return false;

    // RFC 5321 compliant regex - supports plus-addressing (user+tag@domain.com)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (!emailRegex.test(email)) return false;

    // Block disposable/temporary email domains
    const disposableDomains = [
        'guerrillamail.com', 'temp-mail.org', '10minutemail.com',
        'mailinator.com', 'throwaway.email', 'tempmail.com',
        'trashmail.com', 'yopmail.com', 'sharklasers.com'
    ];

    // Extract domain (handle plus-addressing by getting part after @)
    const domain = email.split('@')[1].toLowerCase();
    if (disposableDomains.includes(domain)) {
        return false;
    }

    // Block common test domains
    if (domain === 'test.com' || domain === 'example.com' || domain.endsWith('.test')) {
        return false;
    }

    return true;
}

function shakeInput(input) {
    input.style.borderColor = '#EF4444';
    input.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        input.style.borderColor = '';
        input.style.animation = '';
    }, 2000);
}

// ==================== UI UPDATES ====================
function showSuccess(formId, position) {
    const form = document.getElementById(formId === 'hero' ? 'hero-form' : 'main-form');
    const successEl = document.getElementById('success-message');
    const alreadyEl = document.getElementById('already-message');
    const isEarlyBird = position <= MAX_EARLY_BIRD;

    if (formId === 'main' && successEl) {
        if (form) form.style.display = 'none';
        if (alreadyEl) alreadyEl.classList.add('hidden');

        // Set position
        const positionEl = document.getElementById('user-position');
        if (positionEl) positionEl.textContent = `n°${position}`;

        // Set rewards based on position
        const rewardsEl = document.getElementById('success-rewards');
        if (rewardsEl) {
            if (isEarlyBird) {
                const rewards = calculateRewards(position);
                rewardsEl.innerHTML = rewards.map(r => {
                    const reward = REWARDS[r.toUpperCase()] || { name: r, icon: '🎁' };
                    return `<div class="reward-badge"><span class="reward-icon">${reward.icon}</span><span>${reward.name}</span></div>`;
                }).join('');
            } else {
                // Pas de récompenses Early Bird, mais confirmation d'inscription
                rewardsEl.innerHTML = `
                    <div class="no-rewards-message">
                        <p>🎯 L'objectif Early Bird est déjà atteint, mais vous serez notifié dès le lancement de l'app !</p>
                    </div>
                `;
            }
        }

        // Update title if not early bird
        const successTitle = successEl.querySelector('h3');
        if (successTitle && !isEarlyBird) {
            successTitle.textContent = 'Inscription confirmée !';
        }

        successEl.classList.remove('hidden');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        if (isEarlyBird) {
            showToast(`🎉 Inscrit ! Vous êtes n°${position}`, 'success');
        } else {
            showToast(`✅ Inscrit ! Vous serez notifié au lancement.`, 'success');
        }
    }
}

function showAlreadyRegistered(formId, position) {
    if (formId === 'main') {
        const form = document.getElementById('main-form');
        const successEl = document.getElementById('success-message');
        const alreadyEl = document.getElementById('already-message');

        if (form) form.style.display = 'none';
        if (successEl) successEl.classList.add('hidden');
        if (alreadyEl) {
            // Update message with position if available
            const message = alreadyEl.querySelector('p');
            if (message && position) {
                message.innerHTML = `Cet email est déjà enregistré à la position <strong>n°${position}</strong>. On vous contactera bientôt !`;
            }

            alreadyEl.classList.remove('hidden');
            alreadyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        const msg = position
            ? `👋 Email déjà inscrit ! Vous êtes n°${position}`
            : '👋 Vous êtes déjà inscrit·e !';
        showToast(msg, 'info');
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;

    // Accessibility attributes
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');

    const bgColor = type === 'error' ? '#EF4444' : type === 'info' ? '#3B82F6' : '#8B5CF6';

    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        color: white;
        padding: 16px 32px;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: slideUp 0.5s ease-out;
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease-in forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// ==================== PARTICLES ====================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Reduce particles on mobile for better performance
    const isMobile = window.innerWidth <= 768;
    const particleCount = isMobile ? 15 : 40;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;

        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        particle.style.animationDuration = `${Math.random() * 20 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 10}s`;

        const hue = Math.random() * 60 + 260;
        particle.style.background = `hsl(${hue}, 70%, 60%)`;

        container.appendChild(particle);
    }
}

// ==================== SCROLL ANIMATIONS ====================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .why-point, .comparison-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}

// ==================== NAVBAR ====================
function initNavbar() {
    const navbar = document.querySelector('.navbar');

    // Debounced scroll handler for better performance
    let scrollTimeout;
    const handleScroll = () => {
        if (scrollTimeout) {
            cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = requestAnimationFrame(() => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Mobile menu
    const mobileBtn = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                navLinks.classList.remove('open');
            }
        });
    });
}

// ==================== STYLES ====================
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translate(0) !important;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    
    .navbar.scrolled {
        background: rgba(15, 23, 42, 0.98) !important;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
    }
    
    .reward-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 100px;
        margin: 4px;
        font-size: 0.9rem;
    }
    
    .reward-icon {
        font-size: 1.2rem;
    }
`;
document.head.appendChild(dynamicStyles);

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Landing Page Loading

    // Create particles
    createParticles();

    // Init real-time counter
    await initRealTimeCounter();

    // Form handlers
    const heroForm = document.getElementById('hero-form');
    const mainForm = document.getElementById('main-form');
    const modalForm = document.getElementById('modal-signup-form');

    if (heroForm) {
        heroForm.addEventListener('submit', (e) => handleFormSubmit(e, 'hero'));
    }

    if (mainForm) {
        mainForm.addEventListener('submit', (e) => handleFormSubmit(e, 'main'));
    }

    if (modalForm) {
        modalForm.addEventListener('submit', handleModalSubmit);
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSignupModal();
        }
    });

    // Init animations
    initScrollAnimations();
    initNavbar();


    initFeatureTabs();
});

// ==================== FEATURE TABS FILTERING ====================
function initFeatureTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const cards = document.querySelectorAll('.feature-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const category = tab.dataset.tab;

            // Filter cards with animation
            cards.forEach((card, index) => {
                const cardCategory = card.dataset.category;

                if (category === 'all' || cardCategory === category) {
                    // Show card with staggered animation
                    card.style.display = 'block';
                    card.style.animation = 'none';
                    card.offsetHeight; // Trigger reflow
                    card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.05}s backwards`;
                } else {
                    // Hide card
                    card.style.animation = 'fadeOut 0.3s ease forwards';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// ==================== COOKIE CONSENT ====================
function checkCookieConsent() {
    const consent = localStorage.getItem('pluralconnect_cookie_consent');

    if (!consent) {
        // Show banner after 3 seconds
        setTimeout(() => {
            const banner = document.getElementById('cookie-banner');
            if (banner) {
                banner.classList.remove('hidden');
            }
        }, 3000);
    } else if (consent === 'accepted') {
        // Initialize Google Analytics if accepted
        initAnalytics();
    }
}

function acceptCookies() {
    localStorage.setItem('pluralconnect_cookie_consent', 'accepted');
    hideCookieBanner();
    initAnalytics();
}

function refuseCookies() {
    localStorage.setItem('pluralconnect_cookie_consent', 'refused');
    hideCookieBanner();
}

function hideCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

function initAnalytics() {
    // Analytics initialized via Firebase SDK in index.html
}

// Check cookie consent on page load
checkCookieConsent();

// ==================== FEEDBACK FORMS ====================
function initFeedbackForms() {
    const featureForm = document.getElementById('feature-form');
    const questionForm = document.getElementById('question-form');

    if (featureForm) {
        featureForm.addEventListener('submit', (e) => handleFeedbackSubmit(e, 'feature'));
    }

    if (questionForm) {
        questionForm.addEventListener('submit', (e) => handleFeedbackSubmit(e, 'question'));
    }
}

async function handleFeedbackSubmit(event, type) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;

    // Get form values
    const titleInput = form.querySelector(`#${type}-title`);
    const descInput = form.querySelector(`#${type}-desc`);
    const emailInput = form.querySelector(`#${type}-email`);

    const title = titleInput.value.trim();
    const description = descInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';

    if (!title) {
        showToast('📝 Veuillez entrer un titre', 'error');
        return;
    }

    // Disable form
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

    try {
        await saveFeedback(type, title, description, email);

        // Success
        const successMsg = type === 'feature'
            ? '💡 Merci ! Votre idée a été enregistrée.'
            : '✅ Merci ! Votre question a été envoyée.';
        showToast(successMsg, 'success');

        // Reset form
        form.reset();

    } catch (error) {
        console.error('Feedback error:', error);
        showToast('❌ Erreur lors de l\'envoi. Réessayez.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
    }
}

async function saveFeedback(type, title, description, email) {
    // Save to localStorage as backup
    const feedbacks = JSON.parse(localStorage.getItem('pluralconnect_feedbacks') || '[]');
    feedbacks.push({ type, title, description, email, date: new Date().toISOString() });
    localStorage.setItem('pluralconnect_feedbacks', JSON.stringify(feedbacks));

    if (!isFirebaseReady) {
        return { success: true };
    }

    const { collection, addDoc } = window.firebaseUtils;

    // Save to Firestore
    const feedbackData = {
        type: type, // 'feature' or 'question'
        title: title,
        description: description,
        email: email || null,
        status: 'new',
        source: 'landing_page',
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent
    };

    await addDoc(collection(db, 'feature_requests'), feedbackData);

    return { success: true };
}

// Initialize feedback forms on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initFeedbackForms();
});
