// Data model and localStorage management
class DataModel {
    constructor() {
        this.userId = this.getCurrentUserId();
        this.transactions = [];
        this.categories = [];
        this.budgets = {};
        this.settings = {};
        
        this.init();
    }
    
    init() {
        this.loadUserData();
        this.setupEventListeners();
    }
    
    getCurrentUserId() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id || null;
    }
    
    loadUserData() {
        if (!this.userId) return;
        
        // Load transactions
        const transactionsData = localStorage.getItem(`transactions_${this.userId}`);
        this.transactions = transactionsData ? JSON.parse(transactionsData) : [];
        
        // Load categories
        const categoriesData = localStorage.getItem(`categories_${this.userId}`);
        this.categories = categoriesData ? JSON.parse(categoriesData) : this.getDefaultCategories();
        
        // Load budgets
        const budgetsData = localStorage.getItem(`budgets_${this.userId}`);
        this.budgets = budgetsData ? JSON.parse(budgetsData) : {};
        
        // Load settings
        const settingsData = localStorage.getItem(`settings_${this.userId}`);
        this.settings = settingsData ? JSON.parse(settingsData) : this.getDefaultSettings();
    }
    
    saveUserData() {
        if (!this.userId) return;
        
        localStorage.setItem(`transactions_${this.userId}`, JSON.stringify(this.transactions));
        localStorage.setItem(`categories_${this.userId}`, JSON.stringify(this.categories));
        localStorage.setItem(`budgets_${this.userId}`, JSON.stringify(this.budgets));
        localStorage.setItem(`settings_${this.userId}`, JSON.stringify(this.settings));
    }
    
    getDefaultCategories() {
        return [
            { id: 'cat_food', name: 'Food', color: '#ef4444', budget: 300 },
            { id: 'cat_books', name: 'Books', color: '#6366f1', budget: 200 },
            { id: 'cat_transport', name: 'Transport', color: '#10b981', budget: 100 },
            { id: 'cat_entertainment', name: 'Entertainment', color: '#8b5cf6', budget: 150 },
            { id: 'cat_fees', name: 'Fees', color: '#f59e0b', budget: 500 },
            { id: 'cat_other', name: 'Other', color: '#64748b', budget: 100 }
        ];
    }
    
    getDefaultSettings() {
        return {
            theme: 'light',
            currency: 'USD', // User can set to 'USD', 'RWF', or 'NGN'
            notifications: true,
            language: 'en',
            supportedCurrencies: [
                { code: 'USD', name: 'US Dollar', symbol: '$' },
                { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
                { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' }
            ]
        };
    }
    
    // Transaction methods
    addTransaction(transactionData) {
        const transaction = {
            id: this.generateId('txn'),
            description: ValidationRules.sanitizeDescription(transactionData.description),
            amount: parseFloat(transactionData.amount),
            category: transactionData.category,
            date: transactionData.date,
            type: transactionData.type,
            notes: transactionData.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.transactions.unshift(transaction); // Add to beginning
        this.saveUserData();
        this.notifyChange('transaction-added', transaction);
        
        return transaction;
    }
    
    updateTransaction(id, updates) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index === -1) return null;
        
        this.transactions[index] = {
            ...this.transactions[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.saveUserData();
        this.notifyChange('transaction-updated', this.transactions[index]);
        
        return this.transactions[index];
    }
    
    deleteTransaction(id) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index === -1) return false;
        
        const deleted = this.transactions.splice(index, 1)[0];
        this.saveUserData();
        this.notifyChange('transaction-deleted', deleted);
        
        return true;
    }
    
    getTransaction(id) {
        return this.transactions.find(t => t.id === id) || null;
    }
    
    getTransactions(filters = {}) {
        let filtered = [...this.transactions];
        
        // Date range filter
        if (filters.dateRange) {
            const { start, end } = this.getDateRange(filters.dateRange);
            filtered = filtered.filter(t => {
                const date = new Date(t.date);
                return date >= start && date <= end;
            });
        }
        
        // Category filter
        if (filters.category) {
            filtered = filtered.filter(t => t.category === filters.category);
        }
        
        // Type filter
        if (filters.type) {
            filtered = filtered.filter(t => t.type === filters.type);
        }
        
        // Search filter (regex)
        if (filters.search) {
            try {
                const regex = new RegExp(filters.search, 'i');
                filtered = filtered.filter(t => 
                    regex.test(t.description) || 
                    regex.test(t.notes || '') ||
                    regex.test(t.amount.toString())
                );
            } catch (error) {
                console.warn('Invalid regex pattern:', filters.search);
            }
        }
        
        // Sort
        if (filters.sortBy) {
            filtered.sort((a, b) => {
                const aVal = a[filters.sortBy];
                const bVal = b[filters.sortBy];
                
                if (filters.sortOrder === 'desc') {
                    return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
            });
        }
        
        return filtered;
    }
    
    // Category methods
    addCategory(categoryData) {
        const category = {
            id: this.generateId('cat'),
            name: categoryData.name,
            color: categoryData.color || '#64748b',
            budget: categoryData.budget || 0,
            createdAt: new Date().toISOString()
        };
        
        this.categories.push(category);
        this.saveUserData();
        this.notifyChange('category-added', category);
        
        return category;
    }
    
    updateCategory(id, updates) {
        const index = this.categories.findIndex(c => c.id === id);
        if (index === -1) return null;
        
        this.categories[index] = { ...this.categories[index], ...updates };
        this.saveUserData();
        this.notifyChange('category-updated', this.categories[index]);
        
        return this.categories[index];
    }
    
    deleteCategory(id) {
        const index = this.categories.findIndex(c => c.id === id);
        if (index === -1) return false;
        
        // Don't allow deletion if transactions exist
        const hasTransactions = this.transactions.some(t => t.category === id);
        if (hasTransactions) {
            throw new Error('Cannot delete category with existing transactions');
        }
        
        const deleted = this.categories.splice(index, 1)[0];
        this.saveUserData();
        this.notifyChange('category-deleted', deleted);
        
        return true;
    }
    
    getCategories() {
        return [...this.categories];
    }
    
    getCategory(id) {
        return this.categories.find(c => c.id === id) || null;
    }
    
    // Statistics methods
    getStats(period = 'month') {
        const { start, end } = this.getDateRange(period);
        const transactions = this.getTransactions({ dateRange: period });
        
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = income - expenses;
        
        // Category breakdown
        const categoryStats = {};
        transactions.forEach(t => {
            if (!categoryStats[t.category]) {
                categoryStats[t.category] = { income: 0, expenses: 0, count: 0 };
            }
            
            if (t.type === 'income') {
                categoryStats[t.category].income += t.amount;
            } else {
                categoryStats[t.category].expenses += t.amount;
            }
            categoryStats[t.category].count++;
        });
        
        return {
            period,
            income,
            expenses,
            balance,
            transactionCount: transactions.length,
            categoryStats,
            dateRange: { start, end }
        };
    }
    
    getSpendingTrend(days = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate - (days * 24 * 60 * 60 * 1000));
        
        const transactions = this.transactions.filter(t => {
            const date = new Date(t.date);
            return date >= startDate && date <= endDate && t.type === 'expense';
        });
        
        const dailySpending = {};
        transactions.forEach(t => {
            const date = t.date;
            if (!dailySpending[date]) {
                dailySpending[date] = 0;
            }
            dailySpending[date] += t.amount;
        });
        
        return dailySpending;
    }
    
    // Utility methods
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getDateRange(period) {
        const now = new Date();
        const start = new Date();
        
        switch (period) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
            default:
                start.setFullYear(2000); // All time
        }
        
        return { start, end: now };
    }
    
    // Export/Import methods
    exportData() {
        return {
            transactions: this.transactions,
            categories: this.categories,
            budgets: this.budgets,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }
    
    importData(data) {
        try {
            // Validate data structure
            if (!data.transactions || !Array.isArray(data.transactions)) {
                throw new Error('Invalid data format: transactions missing');
            }
            
            if (!data.categories || !Array.isArray(data.categories)) {
                throw new Error('Invalid data format: categories missing');
            }
            
            // Backup current data
            const backup = this.exportData();
            localStorage.setItem(`backup_${this.userId}_${Date.now()}`, JSON.stringify(backup));
            
            // Import new data
            this.transactions = data.transactions;
            this.categories = data.categories;
            this.budgets = data.budgets || {};
            this.settings = { ...this.settings, ...(data.settings || {}) };
            
            this.saveUserData();
            this.notifyChange('data-imported', data);
            
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }
    
    // Event system
    setupEventListeners() {
        this.listeners = {};
    }
    
    addEventListener(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    
    notifyChange(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

// Global instance
let dataModel = null;

// Initialize when user is logged in
function initializeDataModel() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        dataModel = new DataModel();
        return dataModel;
    }
    return null;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataModel, initializeDataModel };
}