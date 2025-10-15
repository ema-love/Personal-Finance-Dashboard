// Validation rules and utilities
class ValidationRules {
    static patterns = {
        // Description: no leading/trailing spaces, collapse double spaces
        description: /^\S(?:.*\S)?$/,
        
        // Amount: positive number with optional 2 decimal places
        amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
        
        // Date: YYYY-MM-DD format
        date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
        
        // Category: letters, spaces, hyphens only
        category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
        
        // Email validation
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        
        // Strong password (8+ chars, uppercase, lowercase, number, special char)
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        
        // Name validation
        name: /^[A-Za-z]{2,30}$/,
        
        // Duplicate words detection
        duplicateWords: /\b(\w+)\s+\1\b/i,
        
        // Currency amount with cents
        centsPresent: /\.\d{2}\b/,
        
        // Beverage keywords
        beverage: /(coffee|tea|drink|beverage|juice|soda)/i
    };
    
    static messages = {
        description: 'Description cannot have leading/trailing spaces or consecutive spaces',
        amount: 'Please enter a valid amount (e.g., 12.50)',
        date: 'Please enter a valid date (YYYY-MM-DD)',
        category: 'Category can only contain letters, spaces, and hyphens',
        email: 'Please enter a valid email address',
        password: 'Password must be 8+ characters with uppercase, lowercase, number, and special character',
        name: 'Name must be 2-30 letters only',
        required: 'This field is required'
    };
    
    static validate(value, rule, required = true) {
        if (!value && required) {
            return { isValid: false, message: this.messages.required };
        }
        
        if (!value && !required) {
            return { isValid: true, message: '' };
        }
        
        const pattern = this.patterns[rule];
        if (!pattern) {
            return { isValid: true, message: '' };
        }
        
        const isValid = pattern.test(value);
        return {
            isValid,
            message: isValid ? '' : (this.messages[rule] || 'Invalid input')
        };
    }
    
    static validatePassword(password) {
        if (!password) {
            return { strength: 'none', score: 0, message: 'Password is required' };
        }
        
        let score = 0;
        let feedback = [];
        
        // Length check
        if (password.length >= 8) score += 2;
        else feedback.push('At least 8 characters');
        
        // Uppercase check
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('One uppercase letter');
        
        // Lowercase check
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('One lowercase letter');
        
        // Number check
        if (/\d/.test(password)) score += 1;
        else feedback.push('One number');
        
        // Special character check
        if (/[@$!%*?&]/.test(password)) score += 1;
        else feedback.push('One special character');
        
        let strength = 'weak';
        if (score >= 6) strength = 'strong';
        else if (score >= 4) strength = 'good';
        else if (score >= 2) strength = 'fair';
        
        return {
            strength,
            score,
            message: feedback.length ? `Missing: ${feedback.join(', ')}` : 'Strong password!'
        };
    }
    
    static sanitizeDescription(description) {
        return description
            .trim()
            .replace(/\s+/g, ' '); // Collapse multiple spaces
    }
    
    static formatAmount(amount) {
        const num = parseFloat(amount);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    }
    
    static validateForm(formData, rules) {
        const errors = {};
        let isValid = true;
        
        Object.keys(rules).forEach(field => {
            const rule = rules[field];
            const value = formData[field];
            const validation = this.validate(value, rule.type, rule.required);
            
            if (!validation.isValid) {
                errors[field] = validation.message;
                isValid = false;
            }
        });
        
        return { isValid, errors };
    }
}

// Form validation helper
class FormValidator {
    constructor(form) {
        this.form = form;
        this.errors = {};
        this.init();
    }
    
    init() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }
    
    validateField(input) {
        const rule = input.dataset.validation;
        const required = input.hasAttribute('required');
        const value = input.value;
        
        if (!rule) return true;
        
        const validation = ValidationRules.validate(value, rule, required);
        this.displayError(input, validation.message);
        
        return validation.isValid;
    }
    
    validateAll() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    displayError(input, message) {
        const errorElement = document.getElementById(`${input.name || input.id}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            input.classList.toggle('error', !!message);
        }
    }
    
    clearError(input) {
        this.displayError(input, '');
    }
    
    clearAllErrors() {
        const errorElements = this.form.querySelectorAll('.error-message');
        errorElements.forEach(el => el.textContent = '');
        
        const errorInputs = this.form.querySelectorAll('.error');
        errorInputs.forEach(input => input.classList.remove('error'));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ValidationRules, FormValidator };
}