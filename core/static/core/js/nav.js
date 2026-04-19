/**
 * Navigation behavior: scroll progress, active link highlighting,
 * mobile menu toggle, navbar backdrop on scroll.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ─── Scroll Progress Bar ──────────────────────────────
    const progressBar = document.getElementById('scroll-progress');

    function updateScrollProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }

    // ─── Active Nav Link Tracking ─────────────────────────
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.dataset.section === id);
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));

    // ─── GSAP Scroll Reveals ──────────────────────────────
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Reveal-up elements
        gsap.utils.toArray('.reveal-up').forEach((el, i) => {
            gsap.fromTo(el,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    },
                    delay: i * 0.05,
                }
            );
        });

        // Animate skill bars
        gsap.utils.toArray('.skill-fill').forEach(bar => {
            const width = bar.dataset.width || 0;
            gsap.to(bar, {
                width: width + '%',
                duration: 1.5,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: bar,
                    start: 'top 90%',
                    toggleActions: 'play none none none',
                },
            });
        });
    }

    // ─── Mobile Menu ──────────────────────────────────────
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const desktopNav = document.getElementById('desktop-nav');
    const navbarShell = document.getElementById('navbar-shell');
    const navBrand = document.getElementById('nav-brand');

    function isCollapsedNavRequired() {
        if (!desktopNav || !navbarShell || !navBrand) return window.innerWidth < 992;

        const isPortrait = window.innerHeight > window.innerWidth;

        // Show collapsed menu on narrow screens or portrait/vertical screens.
        return window.innerWidth < 768 || isPortrait;
    }

    function syncNavLayout() {
        if (!mobileMenuBtn || !mobileMenu || !desktopNav) return;

        const collapse = isCollapsedNavRequired();
        if (collapse) {
            desktopNav.classList.add('hidden');
            desktopNav.classList.remove('flex');
            desktopNav.style.display = 'none';
            mobileMenuBtn.classList.remove('hidden');
            mobileMenuBtn.classList.add('inline-flex');
            mobileMenuBtn.style.display = 'inline-flex';
            return;
        }

        desktopNav.classList.remove('hidden');
        desktopNav.classList.add('flex');
        desktopNav.style.display = 'flex';
        mobileMenuBtn.classList.add('hidden');
        mobileMenuBtn.classList.remove('inline-flex');
        mobileMenuBtn.style.display = 'none';
        mobileMenu.classList.add('hidden');
        mobileMenu.style.display = '';
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            if (mobileMenuBtn.classList.contains('hidden')) return;
            const isOpen = !mobileMenu.classList.contains('hidden');
            mobileMenu.classList.toggle('hidden');
            mobileMenu.style.display = isOpen ? 'none' : 'block';
            mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
        });

        // Close menu on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileMenu.style.display = 'none';
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });

        // Keep menu state and visibility consistent while resizing.
        window.addEventListener('resize', () => {
            syncNavLayout();
        });

        // Close mobile menu when clicking outside.
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const isClickInside = mobileMenu.contains(target) || mobileMenuBtn.contains(target);
            if (!isClickInside && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                mobileMenu.style.display = 'none';
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Initial pass after first paint ensures accurate width measurements.
        requestAnimationFrame(syncNavLayout);
    }

    // ─── Navbar Scroll Effect ─────────────────────────────
    const navbar = document.getElementById('navbar');

    function updateNavbar() {
        if (!navbar) return;
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // ─── Language Toggle ──────────────────────────────────
    const langToggle = document.getElementById('lang-toggle');
    const langLabel = document.getElementById('lang-label');
    let isGujarati = false;

    const translations = {
        'hero-name': { en: 'Dhyey Patel', gj: 'ધ્યેય પટેલ' },
        'hero-title': { en: 'AI/ML Engineer', gj: 'AI/ML એન્જિનિયર' },
        'hero-subtitle': {
            en: 'Building bridges between languages with fine-tuned Large Language Models. <span class="text-glow-cyan font-semibold">Specializing in Gujarati LLM fine-tuning</span> and offline AI solutions.',
            gj: 'ફાઈન-ટ્યૂન કરેલા લાર્જ લેંગ્વેજ મોડલ્સ સાથે ભાષાઓ વચ્ચે સેતુ બનાવવો. <span class="text-glow-cyan font-semibold">ગુજરાતી LLM ફાઈન-ટ્યૂનિંગમાં વિશેષજ્ઞ</span> અને ઑફલાઈન AI સોલ્યુશન્સ.'
        },
        'about-desc': {
            en: 'From foundational engineering to cutting-edge LLM research — a journey of continuous learning.',
            gj: 'મૂળભૂત એન્જિનિયરિંગથી અત્યાધુનિક LLM સંશોધન સુધી — સતત શીખવાની યાત્રા.'
        },
    };

    if (langToggle) {
        langToggle.addEventListener('click', () => {
            isGujarati = !isGujarati;
            if (langLabel) langLabel.textContent = isGujarati ? 'GJ' : 'EN';

            Object.keys(translations).forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    const text = isGujarati ? translations[id].gj : translations[id].en;
                    el.innerHTML = text;
                }
            });
        });
    }

    // ─── Scroll Listener ──────────────────────────────────
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateScrollProgress();
                updateNavbar();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial calls
    updateScrollProgress();
    updateNavbar();
});
