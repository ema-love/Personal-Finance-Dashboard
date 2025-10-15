// Main landing page scripts
document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Check for saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
            
            // Add ripple effect
            createRipple(this);
        });
    }
    
    function updateThemeIcon(theme) {
        const icon = themeToggle?.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    //  Mobile Navigation
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    let isMenuOpen = false;
    
    if (mobileToggle && navMenu) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'nav-menu-overlay';
        document.body.appendChild(overlay);
        
        // Toggle menu function
        function toggleMenu() {
            isMenuOpen = !isMenuOpen;
            
            // Update toggle button
            mobileToggle.classList.toggle('active', isMenuOpen);
            mobileToggle.setAttribute('aria-expanded', isMenuOpen.toString());
            
            // Update menu
            navMenu.classList.toggle('mobile-active', isMenuOpen);
            overlay.classList.toggle('active', isMenuOpen);
            
            // Animate menu slide-in
            if (isMenuOpen) {
                setTimeout(() => {
                    navMenu.classList.add('show');
                }, 10);
                document.body.style.overflow = 'hidden';
            } else {
                navMenu.classList.remove('show');
                document.body.style.overflow = '';
            }
        }
        
        // Event listeners
        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });
        
        // Close menu when clicking overlay
        overlay.addEventListener('click', function() {
            if (isMenuOpen) {
                toggleMenu();
            }
        });
        
        // Close menu when clicking nav links
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                if (isMenuOpen) {
                    toggleMenu();
                }
            });
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isMenuOpen) {
                toggleMenu();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && isMenuOpen) {
                toggleMenu();
            }
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Add scroll highlight effect
                target.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.3)';
                setTimeout(() => {
                    target.style.boxShadow = '';
                }, 2000);
            }
        });
    });
    
    //  Header scroll effect
    const header = document.querySelector('.header');
    if (header) {
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        function updateHeader() {
            const currentScrollY = window.scrollY;
            const isDark = body.getAttribute('data-theme') === 'dark';
            
            if (currentScrollY > 100) {
                header.style.background = isDark ? 
                    'rgba(15, 23, 42, 0.98)' : 
                    'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                header.style.backdropFilter = 'blur(20px)';
            } else {
                header.style.background = isDark ? 
                    'rgba(15, 23, 42, 0.95)' : 
                    'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }
            
            // Hide/show header on scroll
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        }
        
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', requestTick);
    }
    
    // stats animation with intersection observer
    const stats = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                animateNumber(entry.target);
            }
        });
    }, { threshold: 0.7 });
    
    stats.forEach(stat => statsObserver.observe(stat));
    
    function animateNumber(element) {
        if (element.dataset.animated === 'true') return;
        element.dataset.animated = 'true';
        
        const finalText = element.textContent;
        const numericValue = parseInt(finalText.replace(/[^\d]/g, '')) || 0;
        const suffix = finalText.replace(/[\d]/g, '');
        const duration = 2000;
        const startTime = performance.now();
        
        // Add counter animation class
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.3s ease';
        
        const animate = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const currentValue = Math.floor(numericValue * easeOutCubic(progress));
            
            element.textContent = currentValue + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.transform = 'scale(1)';
                // Add completion effect
                element.style.color = 'var(--accent-primary)';
                setTimeout(() => {
                    element.style.color = '';
                }, 500);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // feature cards with hover effects
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-12px) scale(1.03)';
            this.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.15)';
            
            // Add glow effect
            this.style.setProperty('--glow-opacity', '1');
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '';
            this.style.setProperty('--glow-opacity', '0');
        });
        
        // Add click ripple effect
        card.addEventListener('click', function(e) {
            createRipple(this, e);
        });
    });
    
    // dashboard preview animation
    const preview = document.querySelector('.dashboard-preview');
    if (preview) {
        const transactions = preview.querySelectorAll('.transaction .amount');
        const amounts = ['-$12.50', '-$89.99', '-$15.00', '-$5.75', '-$22.30', '-$45.00', '-$8.99'];
        
        // Animate transactions periodically
        setInterval(() => {
            transactions.forEach((transaction, index) => {
                if (Math.random() > 0.8) { // 20% chance to update
                    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
                    
                    // Animate change
                    transaction.style.transform = 'scale(0.8)';
                    transaction.style.opacity = '0.5';
                    
                    setTimeout(() => {
                        transaction.textContent = randomAmount;
                        transaction.style.transform = 'scale(1)';
                        transaction.style.opacity = '1';
                    }, 200);
                }
            });
        }, 3000);
        
        // Add hover effect to preview
        preview.addEventListener('mouseenter', function() {
            this.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(2deg) translateY(-5px)';
        });
        
        preview.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateY(-10deg) rotateX(5deg) translateY(0px)';
        });
    }
    
    //  progress bar animation
    const progressBars = document.querySelectorAll('.progress');
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const progress = entry.target;
                const finalWidth = progress.style.width || '0%';
                
                progress.dataset.animated = 'true';
                progress.style.width = '0%';
                
                setTimeout(() => {
                    progress.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    progress.style.width = finalWidth;
                }, 100);
            }
        });
    }, { threshold: 0.5 });
    
    progressBars.forEach(bar => progressObserver.observe(bar));
    
    // Utility Functions
    function createRipple(element, event = null) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        
        const size = Math.max(rect.width, rect.height);
        const x = event ? event.clientX - rect.left - size / 2 : rect.width / 2 - size / 2;
        const y = event ? event.clientY - rect.top - size / 2 : rect.height / 2 - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(102, 126, 234, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            z-index: 1000;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }
    
    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    //  scroll-triggered animations
    const animatedElements = document.querySelectorAll('.slide-in-left, .slide-in-right, .fade-in-up, .scale-in');
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                entry.target.classList.add('animate');
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        element.style.animationPlayState = 'paused';
        animationObserver.observe(element);
    });
    
    // Parallax effect for hero background
    let heroParallax = document.querySelector('.hero::before');
    if (heroParallax) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            
            document.documentElement.style.setProperty('--parallax-y', `${parallax}px`);
        });
    }
    
    // Performance optimization: Debounce scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Add loading animations on page load
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
        
        // Stagger animation of feature cards
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 200);
        });
    });
    
    console.log('🎉 SmartFinance landing page loaded with enhanced animations and fixed mobile navigation!');
});