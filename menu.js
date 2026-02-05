// Mobile Menu Toggle
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('hidden');
});

let allMenuItems = [];
let currentCategory = 'all';

// Category Filter
document.querySelectorAll('.category-filter').forEach(button => {
    button.addEventListener('click', () => {
        // Update active button
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Get selected category
        currentCategory = button.dataset.category;
        
        // Filter items
        filterMenuItems(currentCategory);
    });
});

// Load Menu Items from Firebase
async function loadMenuItems() {
    const loadingState = document.getElementById('loadingState');
    const menuContainer = document.getElementById('menuContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (!db) {
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        console.log('Firebase not initialized');
        return;
    }
    
    try {
        const menuSnapshot = await db.collection('menuItems')
            .where('available', '==', true)
            .orderBy('category')
            .orderBy('name')
            .get();
        
        if (menuSnapshot.empty) {
            loadingState.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }
        
        allMenuItems = [];
        menuSnapshot.forEach(doc => {
            allMenuItems.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        loadingState.classList.add('hidden');
        menuContainer.classList.remove('hidden');
        
        displayMenuItems();
    } catch (error) {
        console.error('Error loading menu items:', error);
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }
}

// Display Menu Items
function displayMenuItems() {
    const categories = ['pizza', 'burger', 'sandwich', 'milkshake', 'mocktail', 'maggie', 'more'];
    
    categories.forEach(category => {
        const container = document.getElementById(`${category}-items`);
        const categorySection = container.closest('.category-section');
        const itemsInCategory = allMenuItems.filter(item => item.category === category);
        
        if (itemsInCategory.length === 0) {
            categorySection.style.display = 'none';
            return;
        }
        
        categorySection.style.display = 'block';
        container.innerHTML = itemsInCategory.map(item => createMenuItemCard(item)).join('');
    });
}

// Filter Menu Items by Category
function filterMenuItems(category) {
    const categorySections = document.querySelectorAll('.category-section');
    
    if (category === 'all') {
        categorySections.forEach(section => {
            const sectionCategory = section.dataset.category;
            const itemsInCategory = allMenuItems.filter(item => item.category === sectionCategory);
            if (itemsInCategory.length > 0) {
                section.style.display = 'block';
            }
        });
    } else {
        categorySections.forEach(section => {
            if (section.dataset.category === category) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }
    
    // Scroll to first visible category
    const firstVisible = document.querySelector('.category-section[style*="display: block"]');
    if (firstVisible && category !== 'all') {
        firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Create Menu Item Card HTML
function createMenuItemCard(item) {
    const imageHtml = item.image 
        ? `<img src="${item.image}" alt="${item.name}" class="menu-item-image">`
        : `<div class="menu-item-image-placeholder">${getCategoryEmoji(item.category)}</div>`;
    
    return `
        <div class="menu-item">
            ${imageHtml}
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-2">${item.name}</h3>
                ${item.description ? `<p class="text-gray-600 mb-4">${item.description}</p>` : ''}
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-black text-orange-600">₹${item.price}</span>
                    <a href="https://wa.me/c/919844572129?text=I want to order ${encodeURIComponent(item.name)}" 
                       target="_blank"
                       class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold transition flex items-center gap-2">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Order
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Get Category Emoji
function getCategoryEmoji(category) {
    const emojis = {
        pizza: '🍕',
        burger: '🍔',
        sandwich: '🥪',
        milkshake: '🥤',
        mocktail: '🍹',
        maggie: '🍜',
        more: '🍽️'
    };
    return emojis[category] || '🍽️';
}

// Load menu items on page load
window.addEventListener('load', () => {
    if (db) {
        loadMenuItems();
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

// Observe menu items for animation
setTimeout(() => {
    document.querySelectorAll('.menu-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}, 500);
