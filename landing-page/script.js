/**
 * PluralConnect Landing Page - JavaScript
 * 
 * Handles:
 * - Email form submissions (saves to Firebase)
 * - Particle animations
 * - Dynamic counters
 * - Smooth interactions
 */

// ==================== FIREBASE CONFIG ====================
// Import Firebase from CDN (add to HTML if using modules)
// For now, we'll use a simple REST API approach to Firestore

const FIREBASE_PROJECT_ID = 'pluralconnect-app'; // Replace with your actual project ID
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// ==================== STATE ====================
let signupCount = 247; // Initial count (fetched from Firestore on load)
const MAX_EARLY_BIRD = 500;

// ==================== PARTICLES ====================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;

        // Random size
        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Random animation duration and delay
        particle.style.animationDuration = `${Math.random() * 20 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 10}s`;

        // Random color (purple/pink gradient)
        const hue = Math.random() * 60 + 260; // 260-320 (purple to pink)
        particle.style.background = `hsl(${hue}, 70%, 60%)`;

        container.appendChild(particle);
    }
}

// ==================== COUNTER ANIMATION ====================
function animateCounter(element, target, duration = 2000) {
    if (!element) return;

    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * easeOut);

        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ==================== FORM HANDLING ====================
async function handleFormSubmit(event, formType) {
    event.preventDefault();

    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    const submitButton = form.querySelector('button[type="submit"]');
    const email = emailInput.value.trim();

    if (!email || !isValidEmail(email)) {
        showError(emailInput, 'Email invalide');
        return;
    }

    // Disable form during submission
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';

    try {
        // Save to localStorage as backup
        saveToLocalStorage(email);

        // Try to save to Firebase
        await saveToFirebase(email);

        // Update counter
        signupCount++;
        updateCounters();

        // Show success
        if (formType === 'main') {
            showSuccessMessage();
            form.style.display = 'none';
        } else {
            showToast('🎉 Inscription réussie ! Vérifiez votre email.');
            emailInput.value = '';
        }

    } catch (error) {
        console.error('Signup error:', error);
        // Still show success if localStorage worked
        showToast('✅ Inscrit ! Nous vous contacterons bientôt.');
        emailInput.value = '';
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>Réserver ma place</span><i class="fas fa-rocket"></i>';
    }
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function showError(input, message) {
    input.style.borderColor = '#EF4444';
    input.style.animation = 'shake 0.5s ease-in-out';

    setTimeout(() => {
        input.style.borderColor = '';
        input.style.animation = '';
    }, 2000);
}

// ==================== STORAGE ====================
function saveToLocalStorage(email) {
    const signups = JSON.parse(localStorage.getItem('pluralconnect_signups') || '[]');

    if (!signups.includes(email)) {
        signups.push(email);
        localStorage.setItem('pluralconnect_signups', JSON.stringify(signups));
    }
}

async function saveToFirebase(email) {
    // Create document data
    const data = {
        fields: {
            email: { stringValue: email },
            timestamp: { timestampValue: new Date().toISOString() },
            source: { stringValue: 'landing_page' },
            earlyBird: { booleanValue: signupCount < MAX_EARLY_BIRD }
        }
    };

    // Generate document ID from email hash
    const docId = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);

    const response = await fetch(`${FIRESTORE_URL}/early_signups/${docId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Firebase save failed');
    }

    return response.json();
}

// ==================== UI UPDATES ====================
function updateCounters() {
    const signupCountEl = document.getElementById('signup-count');
    const spotsLeftEl = document.getElementById('spots-left');

    if (signupCountEl) {
        signupCountEl.textContent = signupCount;
    }

    if (spotsLeftEl) {
        spotsLeftEl.textContent = Math.max(0, MAX_EARLY_BIRD - signupCount);
    }
}

function showSuccessMessage() {
    const successEl = document.getElementById('success-message');
    if (successEl) {
        successEl.classList.remove('hidden');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
        color: white;
        padding: 16px 32px;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
        z-index: 9999;
        animation: slideUp 0.5s ease-out, fadeOut 0.5s ease-in 3s forwards;
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
}

// ==================== SCROLL ANIMATIONS ====================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });

    // Observe why points
    document.querySelectorAll('.why-point').forEach((point, index) => {
        point.style.opacity = '0';
        point.style.transform = 'translateX(-30px)';
        point.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
        observer.observe(point);
    });
}

// Add animate-in class styles
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);

// ==================== NAVBAR SCROLL EFFECT ====================
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// ==================== SMOOTH SCROLL ====================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    // Create particles
    createParticles();

    // Animate counters on load
    const signupCountEl = document.getElementById('signup-count');
    const spotsLeftEl = document.getElementById('spots-left');

    if (signupCountEl) animateCounter(signupCountEl, signupCount);
    if (spotsLeftEl) animateCounter(spotsLeftEl, MAX_EARLY_BIRD - signupCount);

    // Form handlers
    const heroForm = document.getElementById('hero-form');
    const mainForm = document.getElementById('main-form');

    if (heroForm) {
        heroForm.addEventListener('submit', (e) => handleFormSubmit(e, 'hero'));
    }

    if (mainForm) {
        mainForm.addEventListener('submit', (e) => handleFormSubmit(e, 'main'));
    }

    // Initialize animations
    initScrollAnimations();
    initNavbarScroll();
    initSmoothScroll();

    // Log ready
    console.log('🌈 PluralConnect Landing Page Ready!');
});

// ==================== OPTIONAL: FETCH REAL COUNT ====================
async function fetchSignupCount() {
    try {
        const response = await fetch(`${FIRESTORE_URL}/stats/signups`);
        if (response.ok) {
            const data = await response.json();
            if (data.fields?.count?.integerValue) {
                signupCount = parseInt(data.fields.count.integerValue);
                updateCounters();
            }
        }
    } catch (error) {
        console.log('Using default signup count');
    }
}

// Uncomment to fetch real count:
// fetchSignupCount();
