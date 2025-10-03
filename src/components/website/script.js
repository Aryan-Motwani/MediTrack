// BMI Calculator Functionality
document.getElementById('bmiForm').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateBMI();
});

function calculateBMI() {
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const heightUnit = document.getElementById('heightUnit').value;
    const weightUnit = document.getElementById('weightUnit').value;
    
    if (!height || !weight) {
        alert('Please enter valid height and weight values');
        return;
    }
    
    // Convert to metric if needed
    let heightInM = height;
    let weightInKg = weight;
    
    if (heightUnit === 'ft') {
        heightInM = height * 0.3048;
    } else {
        heightInM = height / 100;
    }
    
    if (weightUnit === 'lbs') {
        weightInKg = weight * 0.453592;
    }
    
    // Calculate BMI
    const bmi = weightInKg / (heightInM * heightInM);
    
    // Display result
    displayBMIResult(bmi);
}

function displayBMIResult(bmi) {
    const resultSection = document.getElementById('result');
    const bmiValue = document.getElementById('bmiValue');
    const bmiCategory = document.getElementById('bmiCategory');
    const progressFill = document.getElementById('progressFill');
    const progressIndicator = document.getElementById('progressIndicator');
    
    // Show result section
    resultSection.classList.remove('hidden');
    
    // Set BMI value
    bmiValue.textContent = bmi.toFixed(1);
    
    // Determine category and color
    let category, color, progressPercent;
    
    if (bmi < 18.5) {
        category = 'Underweight';
        color = '#FFD300';
        progressPercent = (bmi / 18.5) * 25;
    } else if (bmi < 25) {
        category = 'Normal Weight';
        color = '#00C853';
        progressPercent = 25 + ((bmi - 18.5) / 6.5) * 25;
    } else if (bmi < 30) {
        category = 'Overweight';
        color = '#FF9800';
        progressPercent = 50 + ((bmi - 25) / 5) * 25;
    } else {
        category = 'Obese';
        color = '#F44336';
        progressPercent = 75 + Math.min(((bmi - 30) / 10) * 25, 25);
    }
    
    bmiCategory.textContent = category;
    
    // Animate progress bar
    setTimeout(() => {
        progressFill.style.width = progressPercent + '%';
        progressIndicator.style.left = progressPercent + '%';
        progressFill.style.background = color;
    }, 100);
    
    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Goal card interactions
document.querySelectorAll('.goal-card').forEach(card => {
    card.addEventListener('click', function() {
        const goal = this.dataset.goal;
        handleGoalSelection(goal);
    });
});

function handleGoalSelection(goal) {
    // Remove previous selections
    document.querySelectorAll('.goal-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    event.target.closest('.goal-card').classList.add('selected');
    
    // Store selection (in real app, would send to backend)
    localStorage.setItem('selectedGoal', goal);
    
    // Show feedback
    const feedback = document.createElement('div');
    feedback.className = 'goal-feedback';
    feedback.innerHTML = `
        <div class="feedback-content">
            <div class="feedback-icon">🎉</div>
            <h4>Great Choice!</h4>
            <p>Your personalized plan is being prepared...</p>
        </div>
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

function scrollToGoals() {
    document.getElementById('goals').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Education card interactions
document.querySelectorAll('.edu-card').forEach(card => {
    card.addEventListener('click', function() {
        const topic = this.dataset.topic;
        // In real app, would navigate to detailed education page
        console.log(`Navigate to ${topic} education page`);
    });
});

// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', function() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Add active styles for mobile menu
const style = document.createElement('style');
style.textContent = `
    .hamburger.active span:nth-child(1) {
        transform: rotate(-45deg) translate(-5px, 6px);
    }
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    .hamburger.active span:nth-child(3) {
        transform: rotate(45deg) translate(-5px, -6px);
    }
    
    @media (max-width: 768px) {
        .nav-menu.active {
            display: flex;
            position: fixed;
            top: 80px;
            left: 0;
            width: 100%;
            height: calc(100vh - 80px);
            background: var(--white);
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding-top: 48px;
            box-shadow: var(--shadow-medium);
        }
        
        .goal-feedback {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--white);
            padding: 32px;
            border-radius: 20px;
            box-shadow: var(--shadow-medium);
            text-align: center;
            z-index: 1001;
            animation: fadeInUp 0.5s ease;
        }
        
        .feedback-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }
        
        .feedback-icon {
            font-size: 32px;
        }
        
        .goal-card.selected {
            border-color: var(--primary-green);
            transform: translateY(-8px);
            box-shadow: var(--shadow-medium);
        }
    }
`;
document.head.appendChild(style);

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.backdropFilter = 'blur(20px)';
    } else {
        navbar.style.background = 'var(--white)';
        navbar.style.backdropFilter = 'none';
    }
});
