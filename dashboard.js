//  Dashboard with Dynamic Calculations and Animations
class EnhancedDashboard {
    constructor() {
        this.dataModel = null;
        this.currentUser = null;
        this.chartInstances = {};
        this.animationObserver = null;
        this.currencies = {
            USD: { symbol: '$', rate: 1 },
            EUR: { symbol: '€', rate: 0.85 },
            GBP: { symbol: '£', rate: 0.73 },
            CAD: { symbol: 'C$', rate: 1.25 },
            AUD: { symbol: 'A$', rate: 1.35 },
            NGN: { symbol: '₦', rate: 411.50 },
            RWF: { symbol: 'FRw', rate: 1030.00 },
            ZAR: { symbol: 'R', rate: 14.85 },
            KES: { symbol: 'KSh', rate: 110.25 },
            GHS: { symbol: '₵', rate: 6.15 },
            JPY: { symbol: '¥', rate: 110.15 },
            CHF: { symbol: 'CHF', rate: 0.92 },
            CNY: { symbol: '¥', rate: 6.45 },
            INR: { symbol: '₹', rate: 74.85 }
        };
        
        this.init();
    }
    
    async init() {
        try {
            await this.checkAuthentication();
            await this.initializeDataModel();
            this.setupEventListeners();
            this.setupAnimations();
            this.updateDashboard();
            this.startRealTimeUpdates();
            this.showWelcomeAnimation();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.redirectToLogin();
        }
    }
    
    async checkAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userData = localStorage.getItem('user');
        
        if (!isLoggedIn || !userData) {
            throw new Error('User not authenticated');
        }
        
        this.currentUser = JSON.parse(userData);
        this.updateUserProfile();
    }
    
    async initializeDataModel() {
        const { DataModel } = window;
        this.dataModel = new DataModel();
        
        // Listen for data changes
        this.dataModel.addEventListener('transaction-added', () => this.onDataChange());
        this.dataModel.addEventListener('transaction-updated', () => this.onDataChange());
        this.dataModel.addEventListener('transaction-deleted', () => this.onDataChange());
        this.dataModel.addEventListener('category-added', () => this.onDataChange());
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
        
        // Quick actions
        document.getElementById('addIncomeBtn')?.addEventListener('click', () => this.showTransactionModal('income'));
        document.getElementById('addExpenseBtn')?.addEventListener('click', () => this.showTransactionModal('expense'));
        document.getElementById('quickAddIncome')?.addEventListener('click', () => this.showTransactionModal('income'));
        document.getElementById('quickAddExpense')?.addEventListener('click', () => this.showTransactionModal('expense'));
        document.getElementById('addFirstTransaction')?.addEventListener('click', () => this.showTransactionModal());
        
        // Sidebar
        document.getElementById('sidebarCollapse')?.addEventListener('click', () => this.toggleSidebar());
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => this.toggleMobileSidebar());
        
        // Chart period buttons
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.updateChartPeriod(e.target.dataset.period));
        });
        
        // Search
        document.getElementById('global-search')?.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    setupAnimations() {
        // Intersection Observer for scroll animations
        this.animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });
        
        // Observe animated elements
        document.querySelectorAll('.scale-in, .slide-in-left, .slide-in-right, .slide-in-up, .fade-in-up').forEach(el => {
            this.animationObserver.observe(el);
        });
    }
    
    onDataChange() {
        this.updateDashboard();
        this.showNotification('Data updated successfully', 'success');
        this.triggerStatsAnimation();
    }
    
    updateDashboard() {
        this.updateStats();
        this.updateRecentTransactions();
        this.updateCategories();
        this.updateChart();
        this.updateInsights();
        this.updateTimeBasedGreeting();
    }
    
    updateStats() {
        const stats = this.dataModel.getStats('month');
        const prevStats = this.dataModel.getStats('month', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const currency = this.currencies[this.currentUser.currency] || this.currencies.USD;
        
        // Calculate dynamic values
        const balance = stats.income - stats.expenses;
        const balanceChange = this.calculatePercentageChange(balance, prevStats.income - prevStats.expenses);
        const incomeChange = this.calculatePercentageChange(stats.income, prevStats.income);
        const expensesChange = this.calculatePercentageChange(stats.expenses, prevStats.expenses);
        
        // Update balance
        this.animateValue('balanceAmount', balance, currency);
        this.updateChangeIndicator('balanceChange', balanceChange, balance === 0 ? 'No transactions yet' : null);
        document.getElementById('balanceCurrency').textContent = currency.symbol;
        
        // Update income
        this.animateValue('incomeAmount', stats.income, currency);
        this.updateChangeIndicator('incomeChange', incomeChange, stats.income === 0 ? 'Start adding income' : null);
        document.getElementById('incomeCurrency').textContent = currency.symbol;
        
        // Update expenses
        this.animateValue('expensesAmount', stats.expenses, currency);
        this.updateChangeIndicator('expensesChange', expensesChange, stats.expenses === 0 ? 'Track your spending' : null);
        document.getElementById('expensesCurrency').textContent = currency.symbol;
        
        // Update savings
        const savingsGoal = this.getSavingsGoal();
        const saved = Math.max(0, balance);
        const savingsPercentage = savingsGoal > 0 ? (saved / savingsGoal * 100) : 0;
        
        this.animateValue('savingsPercentage', Math.round(savingsPercentage));
        this.animateCircularProgress('savingsCircle', savingsPercentage);
        document.getElementById('savedAmount').textContent = this.formatCurrency(saved, currency);
        document.getElementById('savingsGoal').textContent = this.formatCurrency(savingsGoal, currency);
        
        // Update expense breakdown
        this.updateExpenseBreakdown(stats.categoryStats);
        
        // Update mini charts
        this.updateMiniCharts();
    }
    
    updateRecentTransactions() {
        const transactions = this.dataModel.getTransactions({ limit: 5 });
        const container = document.getElementById('recentTransactionsList');
        const noDataMessage = document.getElementById('noTransactionsMessage');
        
        if (transactions.length === 0) {
            container.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }
        
        noDataMessage.style.display = 'none';
        const currency = this.currencies[this.currentUser.currency] || this.currencies.USD;
        
        container.innerHTML = transactions.map((transaction, index) => `
            <div class="transaction-item slide-in-fade" style="animation-delay: ${index * 0.1}s">
                <div class="transaction-icon ${transaction.type}">
                    <span>${this.getCategoryIcon(transaction.category)}</span>
                </div>
                <div class="transaction-info">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-meta">
                        <span class="transaction-category">${this.getCategoryName(transaction.category)}</span>
                        <span class="transaction-date">${this.formatDate(transaction.date)}</span>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    <span class="amount-value">
                        ${transaction.type === 'expense' ? '-' : '+'}${this.formatCurrency(transaction.amount, currency)}
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    updateCategories() {
        const categories = this.dataModel.getCategories();
        const container = document.getElementById('categoriesList');
        const noDataMessage = document.getElementById('noCategoriesMessage');
        
        if (categories.length === 0) {
            container.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }
        
        noDataMessage.style.display = 'none';
        const currency = this.currencies[this.currentUser.currency] || this.currencies.USD;
        
        container.innerHTML = categories.map((category, index) => {
            const spent = this.getCategorySpent(category.id);
            const budget = category.budget || 0;
            const percentage = budget > 0 ? (spent / budget * 100) : 0;
            
            return `
                <div class="category-item scale-in" style="animation-delay: ${index * 0.1}s">
                    <div class="category-icon" style="background: ${category.color}20; color: ${category.color}">
                        <span>${this.getCategoryIcon(category.id)}</span>
                    </div>
                    <div class="category-info">
                        <div class="category-name">${category.name}</div>
                        <div class="category-progress">
                            <div class="progress-bar mini">
                                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background: ${category.color}"></div>
                            </div>
                            <span class="progress-text">${this.formatCurrency(spent, currency)} / ${this.formatCurrency(budget, currency)}</span>
                        </div>
                    </div>
                    <div class="category-status ${percentage > 100 ? 'over-budget' : percentage > 80 ? 'warning' : 'good'}">
                        <span class="status-percentage">${Math.round(percentage)}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateChart() {
        const chartContainer = document.getElementById('spendingChartContainer');
        const chartOverlay = document.getElementById('chartOverlay');
        const transactions = this.dataModel.getTransactions();
        
        if (transactions.length === 0) {
            chartOverlay.style.display = 'flex';
            return;
        }
        
        chartOverlay.style.display = 'none';
        this.renderSpendingChart();
    }
    
    updateInsights() {
        const insights = this.generateSmartInsights();
        const container = document.getElementById('smartInsights');
        
        container.innerHTML = insights.map((insight, index) => `
            <div class="insight-item ${insight.type} fade-in" style="animation-delay: ${index * 0.2}s">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.message}</p>
                    ${insight.action ? `<button class="insight-action" data-action="${insight.action}">${insight.actionText}</button>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    generateSmartInsights() {
        const stats = this.dataModel.getStats('month');
        const transactions = this.dataModel.getTransactions();
        const insights = [];
        
        if (transactions.length === 0) {
            return [{
                type: 'welcome',
                icon: '🎉',
                title: 'Welcome to SmartFinance!',
                message: 'Start by adding your first transaction to unlock personalized insights.',
                action: 'add-transaction',
                actionText: 'Add Transaction'
            }];
        }
        
        // Spending pattern insights
        if (stats.expenses > stats.income && stats.income > 0) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Spending Alert',
                message: 'You\'re spending more than you\'re earning this month. Consider reviewing your expenses.',
                action: 'view-budgets',
                actionText: 'Review Budgets'
            });
        }
        
        // Savings insights
        const savingsRate = stats.income > 0 ? ((stats.income - stats.expenses) / stats.income) * 100 : 0;
        if (savingsRate > 20) {
            insights.push({
                type: 'success',
                icon: '💰',
                title: 'Great Savings!',
                message: `You're saving ${savingsRate.toFixed(1)}% of your income. Keep up the excellent work!`
            });
        } else if (savingsRate < 10 && savingsRate > 0) {
            insights.push({
                type: 'tip',
                icon: '💡',
                title: 'Boost Your Savings',
                message: 'Try to save at least 20% of your income. Small changes in spending can make a big difference.'
            });
        }
        
        // Category insights
        const topCategory = this.getTopSpendingCategory();
        if (topCategory) {
            insights.push({
                type: 'info',
                icon: '📊',
                title: 'Top Spending Category',
                message: `You spend most on ${topCategory.name}. Consider setting a budget to track this category better.`,
                action: 'set-budget',
                actionText: 'Set Budget'
            });
        }
        
        // Frequency insights
        const recentDays = 7;
        const recentTransactions = transactions.filter(t => {
            const daysDiff = (new Date() - new Date(t.date)) / (1000 * 60 * 60 * 24);
            return daysDiff <= recentDays;
        });
        
        if (recentTransactions.length > 20) {
            insights.push({
                type: 'tip',
                icon: '🎯',
                title: 'Frequent Transactions',
                message: `You've made ${recentTransactions.length} transactions in the last week. Consider consolidating small expenses.`
            });
        }
        
        return insights.slice(0, 3); // Show max 3 insights
    }
    
    // Animation helpers
    animateValue(elementId, value, currency = null) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const startValue = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) || 0;
        const endValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            const currentValue = startValue + (endValue - startValue) * this.easeOutCubic(progress);
            
            if (currency) {
                element.textContent = Math.abs(currentValue).toFixed(2);
            } else {
                element.textContent = Math.round(currentValue);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    animateCircularProgress(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const circumference = 2 * Math.PI * 25; // radius = 25
        const offset = circumference - (percentage / 100) * circumference;
        
        element.style.transition = 'stroke-dashoffset 1s ease-in-out';
        element.style.strokeDashoffset = offset;
        
        // Update text
        const textElement = document.getElementById('savingsProgressText');
        if (textElement) {
            this.animateValue('savingsProgressText', percentage);
        }
    }
    
    triggerStatsAnimation() {
        document.querySelectorAll('.stat-card').forEach((card, index) => {
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = `pulse 0.6s ease-in-out ${index * 0.1}s`;
            }, 10);
        });
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // Utility methods
    formatCurrency(amount, currency) {
        return `${currency.symbol}${Math.abs(amount).toFixed(2)}`;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) return 'Today';
        if (daysDiff === 1) return 'Yesterday';
        if (daysDiff < 7) return `${daysDiff} days ago`;
        
        return date.toLocaleDateString();
    }
    
    calculatePercentageChange(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / Math.abs(previous)) * 100;
    }
    
    updateChangeIndicator(elementId, percentage, customText = null) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const icon = element.querySelector('.change-icon');
        const text = element.querySelector('.change-text');
        
        if (customText) {
            icon.textContent = '→';
            text.textContent = customText;
            element.className = 'stat-change';
            return;
        }
        
        if (percentage > 0) {
            icon.textContent = '↗';
            text.textContent = `+${percentage.toFixed(1)}% from last month`;
            element.className = 'stat-change positive';
        } else if (percentage < 0) {
            icon.textContent = '↘';
            text.textContent = `${percentage.toFixed(1)}% from last month`;
            element.className = 'stat-change negative';
        } else {
            icon.textContent = '→';
            text.textContent = 'No change from last month';
            element.className = 'stat-change neutral';
        }
    }
    
    updateTimeBasedGreeting() {
        const hour = new Date().getHours();
        const timeOfDayElement = document.getElementById('timeOfDay');
        const userNameElement = document.getElementById('userName');
        const welcomeMessageElement = document.getElementById('welcomeMessage');
        
        let timeOfDay, message;
        
        if (hour < 12) {
            timeOfDay = 'morning';
            message = 'Ready to start your financial day right?';
        } else if (hour < 17) {
            timeOfDay = 'afternoon';
            message = 'How are your finances looking today?';
        } else {
            timeOfDay = 'evening';
            message = 'Time to review your financial progress!';
        }
        
        if (timeOfDayElement) timeOfDayElement.textContent = timeOfDay;
        if (userNameElement) userNameElement.textContent = this.currentUser.firstName || this.currentUser.name || 'Student';
        if (welcomeMessageElement) welcomeMessageElement.textContent = message;
    }
    
    startRealTimeUpdates() {
        // Update time-based elements every minute
        setInterval(() => {
            this.updateTimeBasedGreeting();
        }, 60000);
        
        // Auto-save and sync every 5 minutes
        setInterval(() => {
            this.dataModel.saveUserData();
        }, 300000);
    }
    
    showWelcomeAnimation() {
        const welcomeBanner = document.querySelector('.welcome-banner');
        if (welcomeBanner) {
            setTimeout(() => {
                welcomeBanner.classList.add('animate-in');
            }, 500);
        }
    }
    
    getCategoryIcon(categoryId) {
        const icons = {
            'cat_food': '🍔',
            'cat_books': '📚',
            'cat_transport': '🚌',
            'cat_entertainment': '🎬',
            'cat_fees': '🎓',
            'cat_other': '📦'
        };
        return icons[categoryId] || '📝';
    }
    
    getCategoryName(categoryId) {
        const category = this.dataModel.getCategory(categoryId);
        return category ? category.name : 'Other';
    }
    
    getCategorySpent(categoryId) {
        const transactions = this.dataModel.getTransactions({
            category: categoryId,
            type: 'expense',
            dateRange: 'month'
        });
        return transactions.reduce((sum, t) => sum + t.amount, 0);
    }
    
    getSavingsGoal() {
        return this.currentUser.savingsGoal || 500; // Default goal
    }
    
    getTopSpendingCategory() {
        const stats = this.dataModel.getStats('month');
        const categories = Object.entries(stats.categoryStats)
            .filter(([_, data]) => data.expenses > 0)
            .sort(([_, a], [__, b]) => b.expenses - a.expenses);
            
        if (categories.length === 0) return null;
        
        const [categoryId] = categories[0];
        return this.dataModel.getCategory(categoryId);
    }
    
    // Additional methods for user interaction
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} slide-in-right`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close" aria-label="Close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.classList.add('slide-out-right');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('slide-out-right');
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedDashboard();
});