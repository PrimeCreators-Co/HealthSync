class HealthDashboard {
    constructor() {
        this.data = this.loadData();
        this.notifications = [];
        this.healthTips = this.initHealthTips();
        this.achievements = this.initAchievements();
        this.init();
    }

    init() {
        this.showLoading();
        this.setupEventListeners();
        this.updateAllDisplays();
        this.loadTheme();
        this.startPeriodicUpdates();
        
        setTimeout(() => {
            this.hideLoading();
            this.showWelcomeNotification();
        }, 3000);
    }

    loadData() {
        const defaultData = {
            water: { daily: 0, goal: 8, streak: 0 },
            exercise: { minutes: 0, goal: 30, streak: 0, types: [] },
            sleep: { hours: 0, goal: 8, quality: 4, streak: 0 },
            steps: { daily: 0, goal: 10000, streak: 0 },
            mood: { current: 3, weekly: [3, 4, 3, 5, 4, 3, 4] },
            bmi: { height: 170, weight: 70, value: 0, category: 'Normal' },
            achievements: [],
            stats: { healthScore: 0, dailyStreak: 0 }
        };

        try {
            const savedData = localStorage.getItem('healthDashboardData');
            if (savedData) {
                return { ...defaultData, ...JSON.parse(savedData) };
            }
            return defaultData;
        } catch (error) {
            console.error('Error loading data:', error);
            return defaultData;
        }
    }

    saveData() {
        try {
            localStorage.setItem('healthDashboardData', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showNotification('Error saving data', 'error');
        }
    }

    showLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        const steps = ['Loading health data...', 'Calculating metrics...', 'Preparing insights...', 'Ready to go!'];

        let currentStep = 0;
        const stepInterval = setInterval(() => {
            const stepElements = document.querySelectorAll('.step');
            stepElements.forEach(step => step.classList.remove('active'));
            
            if (stepElements[currentStep]) {
                stepElements[currentStep].classList.add('active');
            }
            
            currentStep++;
            if (currentStep >= steps.length) {
                clearInterval(stepInterval);
            }
        }, 600);
    }

    hideLoading() {
        document.getElementById('loadingScreen').classList.add('hidden');
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                this.toggleTheme(e.target.checked);
            });
        }

        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMobileSidebar();
            });
        }

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
                this.setActiveNavItem(item);
                
                if (window.innerWidth <= 768) {
                    this.closeMobileSidebar();
                }
            });
        });

        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            
            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open') && 
                !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                this.closeMobileSidebar();
            }
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') && !e.target.closest('.sidebar') && !e.target.closest('#menuToggle')) {
                this.closeAllModals();
            }
        });

        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('open')) {
            this.closeMobileSidebar();
        } else {
            this.openMobileSidebar();
        }
    }

    openMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.add('open');
        sidebar.classList.remove('collapsed');
        document.body.style.overflow = 'hidden';
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('open');
        document.body.style.overflow = '';
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth > 768) {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));

            // Update toggle icon
            const sidebarToggle = document.getElementById('sidebarToggle');
            const icon = sidebarToggle.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.className = 'fas fa-chevron-right';
            } else {
                icon.className = 'fas fa-bars';
            }
        }
    }

    handleResize() {
        const sidebar = document.getElementById('sidebar');

        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
            document.body.style.overflow = '';
            const wasCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            sidebar.classList.toggle('collapsed', wasCollapsed);

            // Update toggle icon
            const sidebarToggle = document.getElementById('sidebarToggle');
            const icon = sidebarToggle.querySelector('i');
            if (wasCollapsed) {
                icon.className = 'fas fa-chevron-right';
            } else {
                icon.className = 'fas fa-bars';
            }
        } else {
            sidebar.classList.remove('collapsed');
        }
    }

    toggleTheme(isDark) {
        if (isDark) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            this.showNotification('Dark mode enabled', 'info');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            this.showNotification('Light mode enabled', 'info');
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const themeToggle = document.getElementById('themeToggle');

        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            if (themeToggle) themeToggle.checked = true;
        }

        const wasCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth > 768 && wasCollapsed) {
            sidebar.classList.add('collapsed');

            // Update toggle icon
            const sidebarToggle = document.getElementById('sidebarToggle');
            const icon = sidebarToggle.querySelector('i');
            icon.className = 'fas fa-chevron-right';
        } else if (sidebar && window.innerWidth > 768) {
            // Ensure expanded icon
            const sidebarToggle = document.getElementById('sidebarToggle');
            const icon = sidebarToggle.querySelector('i');
            icon.className = 'fas fa-bars';
        }
    }

    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        const titles = {
            dashboard: 'Health Awareness Dashboard',
            habits: 'Daily Health Habits',
            progress: 'Progress Tracking',
            bmi: 'BMI Calculator',
            insights: 'Health Insights',
            tips: 'Daily Health Tips'
        };
        
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle && titles[sectionId]) {
            pageTitle.textContent = titles[sectionId];
        }
    }

    setActiveNavItem(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    addWater() {
        if (this.data.water.daily < this.data.water.goal + 2) {
            this.data.water.daily++;
            this.updateWaterDisplay();
            this.saveData();
            
            if (this.data.water.daily === this.data.water.goal) {
                this.showNotification('Daily water goal achieved!', 'success');
                this.unlockAchievement('hydration-hero');
            }
            
            this.updateHealthScore();
            this.updateProgressRings();
        } else {
            this.showNotification('You\'ve had enough water for today!', 'warning');
        }
    }

    removeWater() {
        if (this.data.water.daily > 0) {
            this.data.water.daily--;
            this.updateWaterDisplay();
            this.saveData();
            this.updateHealthScore();
            this.updateProgressRings();
        }
    }

    updateWaterDisplay() {
        const waterCount = document.getElementById('waterCount');
        const waterGlasses = document.getElementById('waterGlasses');
        const waterProgress = document.getElementById('waterProgress');
        
        if (waterCount) waterCount.textContent = this.data.water.daily;
        if (waterProgress) waterProgress.textContent = this.data.water.daily;
        
        if (waterGlasses) {
            waterGlasses.innerHTML = '';
            for (let i = 0; i < this.data.water.goal; i++) {
                const glass = document.createElement('div');
                glass.className = `water-glass ${i < this.data.water.daily ? 'filled' : ''}`;
                waterGlasses.appendChild(glass);
            }
        }
        
        const percentage = Math.min((this.data.water.daily / this.data.water.goal) * 100, 100);
        this.updateMetric('hydrationMetric', percentage);
    }

    addExercise(type, minutes) {
        this.data.exercise.minutes += minutes;
        this.data.exercise.types.push({ type, minutes, timestamp: Date.now() });
        
        this.updateExerciseDisplay();
        this.saveData();
        
        if (this.data.exercise.minutes >= this.data.exercise.goal) {
            this.showNotification('Exercise goal completed!', 'success');
            this.unlockAchievement('fitness-fanatic');
        }
        
        this.updateHealthScore();
        this.updateProgressRings();
    }

    logExercise() {
        const exercises = [
            { name: 'Quick Walk', minutes: 15 },
            { name: 'Workout', minutes: 30 },
            { name: 'Yoga Session', minutes: 45 }
        ];
        
        const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
        this.addExercise(randomExercise.name, randomExercise.minutes);
    }

    updateExerciseDisplay() {
        const exerciseMinutes = document.getElementById('exerciseMinutes');
        const exerciseProgressBar = document.getElementById('exerciseProgressBar');
        const exerciseProgress = document.getElementById('exerciseProgress');
        
        if (exerciseMinutes) exerciseMinutes.textContent = this.data.exercise.minutes;
        if (exerciseProgress) exerciseProgress.textContent = this.data.exercise.minutes;
        
        const percentage = Math.min((this.data.exercise.minutes / this.data.exercise.goal) * 100, 100);
        
        if (exerciseProgressBar) {
            exerciseProgressBar.style.width = `${percentage}%`;
        }
        
        this.updateMetric('exerciseMetric', percentage);
    }

    setSleepGoal() {
        document.getElementById('sleepGoalModal').classList.add('show');
    }

    confirmSleepGoal() {
        const sleepGoalInput = document.getElementById('sleepGoalInput');
        const goal = parseFloat(sleepGoalInput.value);
        
        if (goal >= 4 && goal <= 12) {
            this.data.sleep.goal = goal;
            this.updateSleepDisplay();
            this.saveData();
            this.closeSleepGoalModal();
            this.showNotification(`Sleep goal set to ${goal} hours`, 'success');
            this.updateHealthScore();
        } else {
            this.showNotification('Please enter a valid sleep goal (4-12 hours)', 'warning');
        }
    }

    closeSleepGoalModal() {
        document.getElementById('sleepGoalModal').classList.remove('show');
    }

    logSleep() {
        const sleepHours = (Math.random() * 3 + 6).toFixed(1);
        this.data.sleep.hours = parseFloat(sleepHours);
        this.updateSleepDisplay();
        this.saveData();
        this.showNotification(`Logged ${sleepHours} hours of sleep`, 'success');
        this.updateHealthScore();
        this.updateProgressRings();
    }

    updateSleepDisplay() {
        const sleepHours = document.getElementById('sleepHours');
        const sleepProgress = document.getElementById('sleepProgress');
        const sleepRingProgress = document.getElementById('sleepRingProgress');
        
        if (sleepHours) sleepHours.textContent = this.data.sleep.hours.toFixed(1);
        if (sleepProgress) sleepProgress.textContent = this.data.sleep.hours.toFixed(1);
        
        const percentage = Math.min((this.data.sleep.hours / this.data.sleep.goal) * 100, 100);
        
        if (sleepRingProgress) {
            sleepRingProgress.style.background = `conic-gradient(
                from 0deg,
                var(--sleep-color) 0deg ${(percentage / 100) * 360}deg,
                var(--bg-tertiary) ${(percentage / 100) * 360}deg 360deg
            )`;
        }
        
        this.updateMetric('sleepMetric', percentage);
    }

    addSteps() {
        const stepsInput = document.getElementById('stepsInput');
        const steps = parseInt(stepsInput.value);
        
        if (steps && steps > 0 && steps <= 50000) {
            this.data.steps.daily += steps;
            if (this.data.steps.daily > this.data.steps.goal) {
                this.data.steps.daily = this.data.steps.goal;
            }
            
            this.updateStepsDisplay();
            this.saveData();
            stepsInput.value = '';
            
            if (this.data.steps.daily >= this.data.steps.goal) {
                this.showNotification('Step goal achieved!', 'success');
                this.unlockAchievement('step-master');
            } else {
                const remaining = this.data.steps.goal - this.data.steps.daily;
                this.showNotification(`Added ${steps} steps! ${remaining.toLocaleString()} steps to goal`, 'success');
            }
            
            this.updateHealthScore();
            this.updateProgressRings();
        } else {
            this.showNotification('Please enter a valid number of steps (1-50,000)', 'warning');
        }
    }

    updateStepsDisplay() {
        const stepsCount = document.getElementById('stepsCount');
        const stepsProgressBar = document.getElementById('stepsProgressBar');
        const stepsProgress = document.getElementById('stepsProgress');
        
        if (stepsCount) stepsCount.textContent = this.data.steps.daily.toLocaleString();
        if (stepsProgress) {
            const stepsK = (this.data.steps.daily / 1000).toFixed(1);
            stepsProgress.textContent = `${stepsK}k`;
        }
        
        const percentage = Math.min((this.data.steps.daily / this.data.steps.goal) * 100, 100);
        
        if (stepsProgressBar) {
            stepsProgressBar.style.width = `${percentage}%`;
        }
        
        this.updateMetric('stepsMetric', percentage);
    }

    calculateBMI() {
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        
        const height = parseFloat(heightInput.value);
        const weight = parseFloat(weightInput.value);
        
        if (!height || !weight || height < 50 || height > 300 || weight < 20 || weight > 500) {
            this.showNotification('Please enter valid height (50-300 cm) and weight (20-500 kg)', 'warning');
            return;
        }
        
        const heightM = height / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);
        
        this.data.bmi = { height, weight, value: parseFloat(bmi), category: this.getBMICategory(bmi) };
        this.displayBMIResult();
        this.saveData();
        this.showNotification('BMI calculated successfully!', 'success');
    }

    getBMICategory(bmi) {
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }

    displayBMIResult() {
        const bmiResult = document.getElementById('bmiResult');
        const bmiValue = document.getElementById('bmiValue');
        const bmiCategory = document.getElementById('bmiCategory');
        
        if (bmiResult) bmiResult.style.display = 'block';
        if (bmiValue) bmiValue.textContent = this.data.bmi.value;
        if (bmiCategory) bmiCategory.textContent = this.data.bmi.category;
        
        document.querySelectorAll('.scale-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const categoryClass = this.data.bmi.category.toLowerCase();
        const activeItem = document.querySelector(`.scale-item.${categoryClass}`);
        if (activeItem) activeItem.classList.add('active');
    }

    showBMICalculator() {
        this.showSection('bmi');
        this.setActiveNavItem(document.querySelector('[data-section="bmi"]'));
    }

    logMood() {
        const newMood = this.data.mood.current === 5 ? 1 : this.data.mood.current + 1;
        this.setMood(newMood);
    }

    setMood(mood) {
        this.data.mood.current = mood;
        this.data.mood.weekly[this.data.mood.weekly.length - 1] = mood;
        this.saveData();
        this.updateHealthScore();
        
        const moodDescriptions = {
            1: 'Having a tough day',
            2: 'Feeling a bit low',
            3: 'Feeling okay',
            4: 'Having a good day!',
            5: 'Feeling amazing!'
        };
        
        this.showNotification(`Mood updated: ${moodDescriptions[mood]}`, 'success');
    }

    updateProgressRings() {
        const waterPercentage = (this.data.water.daily / this.data.water.goal) * 100;
        const exercisePercentage = (this.data.exercise.minutes / this.data.exercise.goal) * 100;
        const sleepPercentage = (this.data.sleep.hours / this.data.sleep.goal) * 100;
        const stepsPercentage = (this.data.steps.daily / this.data.steps.goal) * 100;
        
        const ringPercentages = [waterPercentage, exercisePercentage, sleepPercentage, stepsPercentage];
        const rings = document.querySelectorAll('.progress-ring');
        
        rings.forEach((ring, index) => {
            if (index < ringPercentages.length) {
                ring.style.setProperty('--progress', Math.min(ringPercentages[index], 100));
            }
        });
    }

    updateHealthScore() {
        const waterScore = Math.min((this.data.water.daily / this.data.water.goal) * 100, 100);
        const exerciseScore = Math.min((this.data.exercise.minutes / this.data.exercise.goal) * 100, 100);
        const sleepScore = Math.min((this.data.sleep.hours / this.data.sleep.goal) * 100, 100);
        const stepsScore = Math.min((this.data.steps.daily / this.data.steps.goal) * 100, 100);
        const moodScore = (this.data.mood.current / 5) * 100;
        
        const overallScore = Math.round((waterScore + exerciseScore + sleepScore + stepsScore + moodScore) / 5);
        this.data.stats.healthScore = overallScore;
        
        const healthScoreElement = document.getElementById('healthScore');
        if (healthScoreElement) {
            this.animateNumber(healthScoreElement, parseInt(healthScoreElement.textContent) || 0, overallScore);
        }
        
        this.saveData();
    }

    updateMetric(metricId, percentage) {
        const metricElement = document.getElementById(metricId);
        if (metricElement) {
            metricElement.style.width = `${Math.min(percentage, 100)}%`;
            
            const valueElement = metricElement.closest('.metric-item')?.querySelector('.metric-value');
            if (valueElement) {
                valueElement.textContent = `${Math.round(percentage)}%`;
            }
        }
    }

    animateNumber(element, from, to) {
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.round(from + (to - from) * progress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    initAchievements() {
        return {
            'hydration-hero': {
                id: 'hydration-hero',
                name: 'Hydration Hero',
                description: '7-day water goal streak',
                icon: 'fas fa-medal',
                unlocked: false,
                condition: () => this.data.water.streak >= 7
            },
            'fitness-fanatic': {
                id: 'fitness-fanatic',
                name: 'Fitness Fanatic',
                description: '30-day exercise streak',
                icon: 'fas fa-dumbbell',
                unlocked: false,
                condition: () => this.data.exercise.streak >= 30
            },
            'step-master': {
                id: 'step-master',
                name: 'Step Master',
                description: 'Reach daily step goal',
                icon: 'fas fa-walking',
                unlocked: false,
                condition: () => this.data.steps.daily >= this.data.steps.goal
            },
            'sleep-champion': {
                id: 'sleep-champion',
                name: 'Sleep Champion',
                description: '7-day sleep goal streak',
                icon: 'fas fa-bed',
                unlocked: false,
                condition: () => this.data.sleep.streak >= 7
            }
        };
    }

    unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (achievement && !achievement.unlocked && achievement.condition()) {
            achievement.unlocked = true;
            this.showNotification(`Achievement Unlocked: ${achievement.name}!`, 'success');
            this.updateAchievementsDisplay();
            this.updateRecommendations();
            this.saveData();
        }
    }

    updateAchievementsDisplay() {
        const achievementsList = document.getElementById('achievementsList');
        if (!achievementsList) return;
        
        achievementsList.innerHTML = '';
        
        Object.values(this.achievements).forEach(achievement => {
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-item ${achievement.unlocked ? 'unlocked' : ''}`;
            
            achievementElement.innerHTML = `
                <div class="achievement-badge ${achievement.unlocked ? '' : 'locked'}">
                    <i class="${achievement.unlocked ? achievement.icon : 'fas fa-lock'}"></i>
                </div>
                <div class="achievement-info">
                    <span class="achievement-name">${achievement.name}</span>
                    <span class="achievement-desc">${achievement.description}</span>
                </div>
            `;
            
            achievementsList.appendChild(achievementElement);
        });
    }

    updateRecommendations() {
        const recommendationsList = document.getElementById('recommendationsList');
        if (!recommendationsList) return;

        const recommendations = [];

        const waterPercentage = (this.data.water.daily / this.data.water.goal) * 100;
        const exercisePercentage = (this.data.exercise.minutes / this.data.exercise.goal) * 100;
        const sleepPercentage = (this.data.sleep.hours / this.data.sleep.goal) * 100;
        const stepsPercentage = (this.data.steps.daily / this.data.steps.goal) * 100;

        if (waterPercentage >= 100) {
            recommendations.push({
                icon: 'fas fa-arrow-up text-success',
                text: 'Great hydration habits! Keep it up.'
            });
        } else if (waterPercentage < 50) {
            recommendations.push({
                icon: 'fas fa-exclamation-triangle text-warning',
                text: 'Try to drink more water throughout the day.'
            });
        }

        if (exercisePercentage >= 100) {
            recommendations.push({
                icon: 'fas fa-arrow-up text-success',
                text: 'Excellent exercise routine! You\'re crushing your goals.'
            });
        } else if (exercisePercentage < 50) {
            recommendations.push({
                icon: 'fas fa-exclamation-triangle text-warning',
                text: 'Try adding 15 more minutes of exercise daily.'
            });
        }

        if (sleepPercentage >= 100) {
            recommendations.push({
                icon: 'fas fa-arrow-up text-success',
                text: 'Perfect sleep schedule! Your body thanks you.'
            });
        } else if (sleepPercentage < 75) {
            recommendations.push({
                icon: 'fas fa-exclamation-triangle text-warning',
                text: 'Consider getting more quality sleep for better recovery.'
            });
        }

        if (stepsPercentage >= 100) {
            recommendations.push({
                icon: 'fas fa-arrow-up text-success',
                text: 'Amazing step count! You\'re staying very active.'
            });
        } else if (stepsPercentage < 50) {
            recommendations.push({
                icon: 'fas fa-exclamation-triangle text-warning',
                text: 'Try to take short walks throughout the day.'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                icon: 'fas fa-info-circle',
                text: 'Keep logging your activities to get personalized recommendations.'
            });
        }

        recommendationsList.innerHTML = '';
        recommendations.forEach(rec => {
            const recElement = document.createElement('div');
            recElement.className = 'recommendation-item';
            recElement.innerHTML = `
                <div class="recommendation-icon">
                    <i class="${rec.icon}"></i>
                </div>
                <div class="recommendation-content">
                    <span class="recommendation-text">${rec.text}</span>
                </div>
            `;
            recommendationsList.appendChild(recElement);
        });
    }

    initHealthTips() {
        return {
            general: [
                "Start your day with a glass of water to boost your metabolism.",
                "Take a 5-minute break every hour to stretch and move around.",
                "Practice deep breathing for 2-3 minutes to reduce stress.",
                "Get some sunlight exposure in the morning to regulate your sleep cycle.",
                "Keep healthy snacks like nuts or fruits within reach.",
                "Stand up and walk while taking phone calls.",
                "Do some light stretching before bedtime to improve sleep quality.",
                "Stay hydrated by keeping a water bottle with you at all times."
            ],
            nutrition: [
                "Eat colorful fruits and vegetables to get a variety of nutrients.",
                "Include protein in every meal to maintain stable blood sugar.",
                "Choose whole grains over refined grains for better nutrition.",
                "Limit processed foods and cook more meals at home.",
                "Eat mindfully and chew your food slowly for better digestion."
            ],
            exercise: [
                "Take the stairs instead of the elevator for extra daily movement.",
                "Do bodyweight exercises like push-ups during TV commercial breaks.",
                "Try high-intensity interval training (HIIT) for time-efficient workouts.",
                "Find a physical activity you enjoy to make exercise sustainable.",
                "Start with just 10 minutes of exercise if you're a beginner."
            ],
            sleep: [
                "Keep your bedroom cool and dark for better sleep quality.",
                "Avoid screens for at least 1 hour before bedtime.",
                "Create a consistent bedtime routine to signal your body it's time to sleep.",
                "Limit caffeine intake after 2 PM to avoid sleep disruption.",
                "Keep a sleep diary to track patterns and identify issues."
            ],
            mental: [
                "Practice gratitude by writing down 3 things you're thankful for daily.",
                "Meditate for just 5 minutes a day to improve mental clarity.",
                "Connect with friends and family regularly for emotional support.",
                "Set boundaries with work and technology to protect your mental health.",
                "Engage in hobbies that bring you joy and relaxation."
            ]
        };
    }

    getNewTip() {
        const allTips = Object.values(this.healthTips).flat();
        const randomTip = allTips[Math.floor(Math.random() * allTips.length)];
        
        const tipElement = document.getElementById('dailyTip');
        if (tipElement) {
            tipElement.textContent = randomTip;
        }
    }

    updateTipsDisplay() {
        const categories = ['nutrition', 'exercise', 'sleep', 'mental'];
        
        categories.forEach(category => {
            const tipElement = document.getElementById(`${category}Tips`);
            if (tipElement && this.healthTips[category]) {
                const randomTip = this.healthTips[category][Math.floor(Math.random() * this.healthTips[category].length)];
                tipElement.innerHTML = `<p>${randomTip}</p>`;
            }
        });
    }

    generateWeeklyChart() {
        const chartContainer = document.getElementById('weeklyChart');
        if (!chartContainer) return;
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = this.data.mood.weekly;
        
        chartContainer.innerHTML = `
            <div class="chart-bars">
                ${days.map((day, index) => `
                    <div class="chart-bar" style="height: ${(data[index] / 5) * 100}%" title="${day}: ${data[index]}/5"></div>
                `).join('')}
            </div>
            <div class="chart-labels">
                ${days.map(day => `<span class="chart-label">${day}</span>`).join('')}
            </div>
        `;
    }

    updateStreaks() {
        const waterStreakElement = document.getElementById('waterStreak');
        if (waterStreakElement) {
            waterStreakElement.textContent = `${this.data.water.streak} days`;
        }
        
        const exerciseStreakElement = document.getElementById('exerciseStreak');
        if (exerciseStreakElement) {
            exerciseStreakElement.textContent = `${this.data.exercise.streak} days`;
        }
        
        const dailyStreakElement = document.getElementById('dailyStreak');
        if (dailyStreakElement) {
            dailyStreakElement.textContent = this.data.stats.dailyStreak;
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <button class="notification-close" onclick="healthDashboard.closeNotification(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            this.closeNotification(notification);
        }, 5000);
        
        this.notifications.push(notification);
    }

    closeNotification(notification) {
        if (!notification || !notification.classList) return;
        
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 300);
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'w':
                    e.preventDefault();
                    this.addWater();
                    break;
                case 'e':
                    e.preventDefault();
                    this.logExercise();
                    break;
                case 's':
                    e.preventDefault();
                    this.logSleep();
                    break;
                case 'm':
                    e.preventDefault();
                    this.logMood();
                    break;
                case 'b':
                    e.preventDefault();
                    this.showBMICalculator();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    showWelcomeNotification() {
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        else if (hour >= 17) greeting = 'Good evening';
        
        this.showNotification(`${greeting}! Ready to achieve your health goals today?`, 'success');
    }

    startPeriodicUpdates() {
        this.scheduleDailyReset();
        setInterval(() => this.reminder(), 30 * 1000);
    }

    scheduleDailyReset() {
        const virtualDay = 24 * 60 * 60 * 1000;

        setTimeout(() => {
            this.dailyReset();
            setInterval(() => this.dailyReset(), virtualDay);
        }, virtualDay);
    }

    dailyReset() {
        if (this.data.water.daily >= this.data.water.goal) {
            this.data.water.streak++;
            this.data.stats.dailyStreak++;
        } else {
            this.data.water.streak = 0;
            this.data.stats.dailyStreak = 0;
        }

        if (this.data.exercise.minutes >= this.data.exercise.goal) {
            this.data.exercise.streak++;
        } else {
            this.data.exercise.streak = 0;
        }

        if (this.data.sleep.hours >= this.data.sleep.goal) {
            this.data.sleep.streak++;
        } else {
            this.data.sleep.streak = 0;
        }

        if (this.data.steps.daily >= this.data.steps.goal) {
            this.data.steps.streak++;
        } else {
            this.data.steps.streak = 0;
        }

        this.data.water.daily = 0;
        this.data.exercise.minutes = 0;
        this.data.exercise.types = [];
        this.data.sleep.hours = 0;
        this.data.steps.daily = 0;

        this.data.mood.weekly.push(3);
        if (this.data.mood.weekly.length > 7) {
            this.data.mood.weekly = this.data.mood.weekly.slice(-7);
        }

        this.updateAllDisplays();
        this.saveData();
        this.showNotification('A new day has started! Resetting goals.', 'success');
    }

    reminder() {
        if (this.data.water.daily < this.data.water.goal) {
            this.showNotification('Time to drink water!', 'info');
        }
    }

    updateAllDisplays() {
        this.updateWaterDisplay();
        this.updateExerciseDisplay();
        this.updateSleepDisplay();
        this.updateStepsDisplay();
        this.updateProgressRings();
        this.updateHealthScore();
        this.updateStreaks();
        this.updateAchievementsDisplay();
        this.updateRecommendations();
        this.updateTipsDisplay();
        this.generateWeeklyChart();
        
        if (this.data.bmi.value > 0) {
            this.displayBMIResult();
        }
    }
}

let healthDashboard;

function addWater() {
    healthDashboard.addWater();
}

function removeWater() {
    healthDashboard.removeWater();
}

function addExercise(type, minutes) {
    healthDashboard.addExercise(type, minutes);
}

function logExercise() {
    healthDashboard.logExercise();
}

function logSleep() {
    healthDashboard.logSleep();
}

function setSleepGoal() {
    healthDashboard.setSleepGoal();
}

function confirmSleepGoal() {
    healthDashboard.confirmSleepGoal();
}

function closeSleepGoalModal() {
    healthDashboard.closeSleepGoalModal();
}

function addSteps() {
    healthDashboard.addSteps();
}

function calculateBMI() {
    healthDashboard.calculateBMI();
}

function showBMICalculator() {
    healthDashboard.showBMICalculator();
}

function logMood() {
    healthDashboard.logMood();
}

function getNewTip() {
    healthDashboard.getNewTip();
}

document.addEventListener('DOMContentLoaded', () => {
    healthDashboard = new HealthDashboard();
});

window.addEventListener('online', () => {
    if (healthDashboard) {
        healthDashboard.showNotification('Back online! Data synced.', 'success');
    }
});

window.addEventListener('offline', () => {
    if (healthDashboard) {
        healthDashboard.showNotification('You\'re offline. Data will sync when reconnected.', 'warning');
    }
});

window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    if (healthDashboard) {
        healthDashboard.showNotification('An error occurred. Please refresh if issues persist.', 'error');
    }
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && healthDashboard) {
        healthDashboard.updateAllDisplays();
    }
});