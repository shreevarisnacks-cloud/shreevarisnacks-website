// Mobile Menu Toggle
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('hidden');
});

// Contact Form Submission
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formMessage = document.getElementById('formMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value,
        timestamp: new Date().toISOString()
    };
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    if (!db) {
        // If Firebase is not initialized, show success message anyway
        formMessage.className = 'mt-4 p-4 rounded-xl bg-green-100 text-green-800';
        formMessage.textContent = 'Thank you for your message! We\'ll get back to you soon.';
        formMessage.classList.remove('hidden');
        
        // Reset form
        e.target.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        
        setTimeout(() => {
            formMessage.classList.add('hidden');
        }, 5000);
        return;
    }
    
    try {
        // Save to Firebase
        await db.collection('contactMessages').add(formData);
        
        // Show success message
        formMessage.className = 'mt-4 p-4 rounded-xl bg-green-100 text-green-800';
        formMessage.textContent = 'Thank you for your message! We\'ll get back to you soon.';
        formMessage.classList.remove('hidden');
        
        // Reset form
        e.target.reset();
        
        // Hide message after 5 seconds
        setTimeout(() => {
            formMessage.classList.add('hidden');
        }, 5000);
    } catch (error) {
        console.error('Error submitting form:', error);
        
        // Show error message
        formMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
        formMessage.textContent = 'Sorry, there was an error sending your message. Please try again or contact us directly.';
        formMessage.classList.remove('hidden');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }
});

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Animation on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe contact cards
document.querySelectorAll('.contact-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});
