// Mobile Menu Toggle
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('hidden');
});

// Load Offers from Firebase
async function loadOffers() {
    const offersContainer = document.getElementById('offersContainer');
    
    if (!db) {
        console.log('Firebase not initialized, using default offers');
        return;
    }
    
    try {
        const offersSnapshot = await db.collection('offers')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(6)
            .get();
        
        if (offersSnapshot.empty) {
            console.log('No offers found');
            return;
        }
        
        offersContainer.innerHTML = '';
        
        offersSnapshot.forEach(doc => {
            const offer = doc.data();
            const offerCard = createOfferCard(offer);
            offersContainer.innerHTML += offerCard;
        });
    } catch (error) {
        console.error('Error loading offers:', error);
    }
}

// Create Offer Card HTML
function createOfferCard(offer) {
    return `
        <div class="offer-card">
            <div class="offer-badge">${offer.badge || 'SPECIAL OFFER'}</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">${offer.title}</h3>
            <p class="text-gray-600 mb-4">${offer.description}</p>
            <div class="text-3xl font-black text-orange-600">${offer.price}</div>
        </div>
    `;
}

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

// Load offers on page load
window.addEventListener('load', () => {
    if (db) {
        loadOffers();
    }
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

// Observe elements with fade-in animation
document.querySelectorAll('.popular-item, .offer-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});
