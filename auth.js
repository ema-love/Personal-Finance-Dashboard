// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle for auth pages
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Initialize theme
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
        });
    }
    
    function updateThemeIcon(theme) {
        const icon = themeToggle?.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    // Password toggle functionality
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('.toggle-icon');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '🙈';
            } else {
                input.type = 'password';
                icon.textContent = '👁️';
            }
        });
    });
    
    // Password strength indicator
    const passwordInput = document.getElementById('password');
    const strengthMeter = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (passwordInput && strengthMeter) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const validation = ValidationRules.validatePassword(password);
            
            // Update strength meter
            strengthMeter.className = `strength-bar ${validation.strength}`;
            
            // Update text
            if (strengthText) {
                strengthText.textContent = `Password strength: ${validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1)}`;
            }
        });
    }
    
    // Login form handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const validator = new FormValidator(loginForm);
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validator.validateAll()) {
                showMessage('Please fix the errors below', 'error');
                return;
            }
            
            const formData = new FormData(this);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password'),
                remember: formData.get('remember') === 'on'
            };
            
            await handleLogin(loginData);
        });
    }
    
    // Register form handling
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        const validator = new FormValidator(registerForm);
        
        // Password confirmation validation
        const confirmPassword = document.getElementById('confirmPassword');
        const password = document.getElementById('password');
        
        if (confirmPassword && password) {
            confirmPassword.addEventListener('blur', function() {
                if (this.value && this.value !== password.value) {
                    validator.displayError(this, 'Passwords do not match');
                } else {
                    validator.clearError(this);
                }
            });
        }
        
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validator.validateAll()) {
                showMessage('Please fix the errors below', 'error');
                return;
            }
            
            const formData = new FormData(this);
            const registerData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                password: formData.get('password'),
                currency: formData.get('currency'),
                terms: formData.get('terms') === 'on'
            };
            
            if (!registerData.terms) {
                showMessage('Please accept the terms and conditions', 'error');
                return;
            }
            
            await handleRegister(registerData);
        });
    }
    
    // Authentication functions
    async function handleLogin(loginData) {
        showLoading(true);
        
        try {
            // Simulate API call
            await delay(1500);
            
            // For demo purposes, accept any valid email/password
            if (ValidationRules.validate(loginData.email, 'email').isValid && 
                loginData.password.length >= 6) {
                
                // Store user session
                const userData = {
                    id: generateId(),
                    email: loginData.email,
                    name: loginData.email.split('@')[0],
                    loginTime: new Date().toISOString(),
                    currency: 'USD'
                };
                
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('isLoggedIn', 'true');
                
                if (loginData.remember) {
                    localStorage.setItem('rememberLogin', 'true');
                }
                
                showMessage('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                
            } else {
                throw new Error('Invalid email or password');
            }
            
        } catch (error) {
            showMessage(error.message || 'Login failed. Please try again.', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    async function handleRegister(registerData) {
        showLoading(true);
        
        try {
            // Simulate API call
            await delay(2000);
            
            // Create user account
            const userData = {
                id: generateId(),
                email: registerData.email,
                name: `${registerData.firstName} ${registerData.lastName}`,
                firstName: registerData.firstName,
                lastName: registerData.lastName,
                currency: registerData.currency,
                registrationTime: new Date().toISOString(),
                settings: {
                    theme: 'light',
                    notifications: true,
                    currency: registerData.currency
                }
            };
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('isLoggedIn', 'true');
            
            // Initialize user's data
            initializeUserData(userData.id);
            
            showMessage('Account created successfully! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            showMessage(error.message || 'Registration failed. Please try again.', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    function initializeUserData(userId) {
        // Initialize default categories
        const defaultCategories = [
            { id: 'cat_food', name: 'Food', color: '#ef4444', budget: 300 },
            { id: 'cat_books', name: 'Books', color: '#6366f1', budget: 200 },
            { id: 'cat_transport', name: 'Transport', color: '#10b981', budget: 100 },
            { id: 'cat_entertainment', name: 'Entertainment', color: '#8b5cf6', budget: 150 },
            { id: 'cat_fees', name: 'Fees', color: '#f59e0b', budget: 500 },
            { id: 'cat_other', name: 'Other', color: '#64748b', budget: 100 }
        ];
        
        localStorage.setItem(`categories_${userId}`, JSON.stringify(defaultCategories));
        localStorage.setItem(`transactions_${userId}`, JSON.stringify([]));
        localStorage.setItem(`budgets_${userId}`, JSON.stringify({}));
    }
    
    // Utility functions
    function generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
    }
    
    function showMessage(message, type) {
        // Create status message
        const statusContainer = document.createElement('div');
        statusContainer.className = `status-message status-${type}`;
        statusContainer.textContent = message;
        statusContainer.setAttribute('role', 'alert');
        
        // Add to page
        document.body.appendChild(statusContainer);
        
        // Position it
        statusContainer.style.position = 'fixed';
        statusContainer.style.top = '20px';
        statusContainer.style.right = '20px';
        statusContainer.style.zIndex = '10000';
        statusContainer.style.maxWidth = '400px';
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            statusContainer.remove();
        }, 5000);
    }
    
    // Check if already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        // Redirect to dashboard if on auth pages
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('register.html')) {
            window.location.href = 'dashboard.html';
        }
    }
});