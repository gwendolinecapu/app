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
const MIN_SUBMIT_INTERVAL = 2000; // 2 seconds between submissions
const REWARDS = {
    PIONEER_THEME: { name: 'Thème Pioneer Exclusif', icon: '🎨', tier: 500 },
    CREDITS_500: { name: '500 Crédits Bonus', icon: '💎', tier: 500 },
    BADGE_PIONEER: { name: 'Badge Pioneer Permanent', icon: '⭐', tier: 500 },
    EXTRA_CREDITS: { name: '+200 Crédits Extra', icon: '🌟', tier: 100 },
    BETA_ACCESS: { name: 'Accès Beta Privée', icon: '🚀', tier: 50 }
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

        // Change color based on progress
        if (progress >= 90) {
            progressBar.style.background = 'linear-gradient(90deg, #EF4444, #F59E0B)';
        } else if (progress >= 70) {
            progressBar.style.background = 'linear-gradient(90deg, #F59E0B, #FBBF24)';
        }
    }

    // Update status text
    const statusEl = document.getElementById('counter-status');
    if (statusEl) {
        if (spotsLeft === 0) {
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Objectif atteint ! Les inscriptions restent ouvertes.';
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
    if (badge && spotsLeft === 0) {
        badge.innerHTML = '<i class="fas fa-trophy"></i> Objectif atteint !';
        badge.classList.add('completed');
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

    // Disable form
    submitButton.disabled = true;
    const originalContent = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';

    try {
        const result = await registerEmail(email);

        if (result.alreadyExists) {
            showAlreadyRegistered(formId, result.position);
        } else {
            showSuccess(formId, result.position);
            // Force counter UI update immediately after new signup
            updateCounterUI(result.position);
        }

        emailInput.value = '';

    } catch (error) {
        console.error('Signup error:', error);

        // Check if error contains position info (handled duplicate)
        if (error.position) {
            showAlreadyRegistered(formId, error.position);
        } else {
            const errorMsg = error.message || '❌ Erreur lors de l\'inscription. Réessayez.';
            showToast(errorMsg, 'error');
        }
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalContent;
    }
}

async function registerEmail(email) {
    // Save to localStorage first (backup)
    saveToLocalStorage(email);

    if (!isFirebaseReady) {
        return { success: true, position: signupCount + 1, alreadyExists: false };
    }

    const { doc, getDoc, setDoc } = window.firebaseUtils;

    // Create unique key from email
    const emailKey = email.replace(/[.@]/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const signupRef = doc(db, 'early_signups', emailKey);
    const counterRef = doc(db, 'landing_stats', 'signup_counter');

    try {
        // Step 1: Check if email already exists
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

        // Step 3: Save signup
        await setDoc(signupRef, {
            email: email,
            position: newPosition,
            isEarlyBird: newPosition <= MAX_EARLY_BIRD,
            rewards: calculateRewards(newPosition),
            registeredAt: new Date().toISOString(),
            source: 'landing_page'
        });

        // Step 4: Update counter
        await setDoc(counterRef, {
            count: newPosition,
            lastUpdated: new Date().toISOString()
        });

        // Step 5: Update local state
        signupCount = newPosition;

        return { success: true, position: newPosition, alreadyExists: false };

    } catch (error) {
        console.error('[Registration Error]', error);
        throw new Error('📧 Inscription échouée. Veuillez réessayer.');
    }
}


function calculateRewards(position) {
    const rewards = [];

    // All early birds get these
    if (position <= MAX_EARLY_BIRD) {
        rewards.push('pioneer_theme', 'credits_500', 'badge_pioneer');
    }

    // Top 100 get extra
    if (position <= 100) {
        rewards.push('extra_credits');
    }

    // Top 50 get beta access
    if (position <= 50) {
        rewards.push('beta_access');
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
 * - RFC 5321 compliant regex
 * - Blocks disposable email domains
 * - Length validation (min 6, max 254)
 */
function isValidEmail(email) {
    // Length checks (RFC 5321)
    if (email.length < 6 || email.length > 254) return false;

    // Strict regex - RFC 5321 compliant
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (!emailRegex.test(email)) return false;

    // Block disposable/temporary email domains
    const disposableDomains = [
        'guerrillamail.com', 'temp-mail.org', '10minutemail.com',
        'mailinator.com', 'throwaway.email', 'tempmail.com',
        'trashmail.com', 'yopmail.com', 'sharklasers.com'
    ];

    const domain = email.split('@')[1];
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

    if (formId === 'main' && successEl) {
        if (form) form.style.display = 'none';
        if (alreadyEl) alreadyEl.classList.add('hidden');

        // Set position
        const positionEl = document.getElementById('user-position');
        if (positionEl) positionEl.textContent = `n°${position}`;

        // Set rewards based on position
        const rewardsEl = document.getElementById('success-rewards');
        if (rewardsEl) {
            const rewards = calculateRewards(position);
            rewardsEl.innerHTML = rewards.map(r => {
                const reward = REWARDS[r.toUpperCase()] || { name: r, icon: '🎁' };
                return `<div class="reward-badge"><span class="reward-icon">${reward.icon}</span><span>${reward.name}</span></div>`;
            }).join('');
        }

        successEl.classList.remove('hidden');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        showToast(`🎉 Inscrit ! Vous êtes n°${position}`, 'success');
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

    for (let i = 0; i < 40; i++) {
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

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

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

    if (heroForm) {
        heroForm.addEventListener('submit', (e) => handleFormSubmit(e, 'hero'));
    }

    if (mainForm) {
        mainForm.addEventListener('submit', (e) => handleFormSubmit(e, 'main'));
    }

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
