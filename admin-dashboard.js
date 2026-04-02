// Check if admin is logged in
window.addEventListener('load', async () => {
    if (!auth || !db) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        // Check if user is admin
        try {
            const adminDoc = await db.collection('admins').doc(user.uid).get();
            if (!adminDoc.exists) {
                await auth.signOut();
                window.location.href = 'admin-login.html';
                return;
            }
            
            // Display admin name
            const adminData = adminDoc.data();
            document.getElementById('adminUserName').textContent = adminData.name || user.email;
            
            // Load dashboard data
            loadMenuItems();
            loadOffers();
        } catch (error) {
            console.error('Error verifying admin:', error);
            window.location.href = 'admin-login.html';
        }
    });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await auth.signOut();
            window.location.href = 'admin-login.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error logging out. Please try again.');
        }
    }
});

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show corresponding tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    });
});

// ==================== IMAGE UPLOAD WITH CLOUDINARY ====================

// Upload Image Button Handler
document.getElementById('uploadImageBtn').addEventListener('click', () => {
    document.getElementById('itemImageFile').click();
});

// File Input Change Handler
document.getElementById('itemImageFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
    }
    
    try {
        // Show progress
        document.getElementById('uploadProgress').classList.remove('hidden');
        document.getElementById('uploadImageBtn').disabled = true;
        document.getElementById('uploadBtnText').textContent = 'Uploading...';
        
        // Upload to Cloudinary
        const result = await CloudinaryHelper.uploadImage(file);
        
        // Set the URL in the input field
        document.getElementById('itemImage').value = result.url;
        
        // Show preview
        showImagePreview(result.url);
        
        // Hide progress
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadImageBtn').disabled = false;
        document.getElementById('uploadBtnText').textContent = 'Upload Image';
        
        alert('Image uploaded successfully!');
    } catch (error) {
        console.error('Upload error:', error);
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadImageBtn').disabled = false;
        document.getElementById('uploadBtnText').textContent = 'Upload Image';
        
        if (error.message.includes('Cloudinary not configured')) {
            alert('Cloudinary is not configured. Please update your Cloudinary settings in firebase-config.js\n\nSee CLOUDINARY_SETUP.md for instructions.');
        } else {
            alert('Error uploading image. Please try again.\n\n' + error.message);
        }
    }
});

// Show image preview
function showImagePreview(url) {
    document.getElementById('previewImg').src = url;
    document.getElementById('imagePreview').classList.remove('hidden');
}

// Remove image
document.getElementById('removeImageBtn').addEventListener('click', () => {
    document.getElementById('itemImage').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('itemImageFile').value = '';
});

// Show preview when URL is manually entered
document.getElementById('itemImage').addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        showImagePreview(url);
    }
});

// ==================== MENU MANAGEMENT ====================

let editingItemId = null;

// Add/Edit Menu Item
document.getElementById('addItemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const itemData = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        description: document.getElementById('itemDescription').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        image: document.getElementById('itemImage').value || '',
        available: document.getElementById('itemAvailable').checked,
        updatedAt: new Date().toISOString()
    };
    
    submitBtn.disabled = true;
    submitBtn.textContent = editingItemId ? 'Updating...' : 'Adding...';
    
    try {
        if (editingItemId) {
            // Update existing item
            await db.collection('menuItems').doc(editingItemId).update(itemData);
            alert('Item updated successfully!');
        } else {
            // Add new item
            itemData.createdAt = new Date().toISOString();
            await db.collection('menuItems').add(itemData);
            alert('Item added successfully!');
        }
        
        // Reset form
        e.target.reset();
        editingItemId = null;
        document.getElementById('editItemId').value = '';
        document.getElementById('cancelEdit').classList.add('hidden');
        document.getElementById('imagePreview').classList.add('hidden');
        submitBtn.textContent = 'Add Item';
        
        // Reload items
        loadMenuItems();
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Error saving item. Please try again.');
    } finally {
        submitBtn.disabled = false;
    }
});

// Cancel Edit
document.getElementById('cancelEdit').addEventListener('click', () => {
    document.getElementById('addItemForm').reset();
    editingItemId = null;
    document.getElementById('editItemId').value = '';
    document.getElementById('cancelEdit').classList.add('hidden');
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('addItemForm').querySelector('button[type="submit"]').textContent = 'Add Item';
});

// Load Menu Items
async function loadMenuItems() {
    const itemsList = document.getElementById('itemsList');
    const filterCategory = document.getElementById('filterCategory').value;
    
    try {
        let query = db.collection('menuItems');
        
        if (filterCategory !== 'all') {
            query = query.where('category', '==', filterCategory);
        }
        
        const snapshot = await query.orderBy('category').orderBy('name').get();
        
        if (snapshot.empty) {
            itemsList.innerHTML = '<p class="text-gray-500 text-center py-8">No items found</p>';
            return;
        }
        
        itemsList.innerHTML = snapshot.docs.map(doc => {
            const item = doc.data();
            return createItemCard(doc.id, item);
        }).join('');
        
        // Attach event listeners
        attachItemEventListeners();
    } catch (error) {
        console.error('Error loading items:', error);
        itemsList.innerHTML = '<p class="text-red-500 text-center py-8">Error loading items</p>';
    }
}

// Filter items by category
document.getElementById('filterCategory').addEventListener('change', loadMenuItems);

// Create item card HTML
function createItemCard(id, item) {
    const categoryEmoji = {
        pizza: '🍕',
        burger: '🍔',
        sandwich: '🥪',
        milkshake: '🥤',
        mocktail: '🍹',
        maggie: '🍜',
        more: '🍽️'
    };
    
    return `
        <div class="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition">
            <div class="flex items-start space-x-4">
                ${item.image ? `
                    <img src="${item.image}" alt="${item.name}" 
                         class="w-20 h-20 object-cover rounded-lg">
                ` : `
                    <div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-3xl">
                        ${categoryEmoji[item.category] || '🍽️'}
                    </div>
                `}
                <div class="flex-1">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="font-bold text-gray-900">${item.name}</h3>
                            <p class="text-sm text-gray-600">${item.category}</p>
                            ${item.description ? `<p class="text-sm text-gray-500 mt-1">${item.description}</p>` : ''}
                        </div>
                        <span class="font-bold text-orange-600">₹${item.price}</span>
                    </div>
                    <div class="flex items-center space-x-2 mt-2">
                        <span class="px-2 py-1 text-xs rounded-full ${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${item.available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                    <div class="flex space-x-2 mt-3">
                        <button onclick="editItem('${id}')" class="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                            Edit
                        </button>
                        <button onclick="deleteItem('${id}', '${item.name}')" class="text-red-600 hover:text-red-700 text-sm font-semibold">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Attach event listeners to dynamically created elements
function attachItemEventListeners() {
    // Event listeners are handled via onclick attributes in the HTML
}

// Edit item
window.editItem = async (id) => {
    try {
        const doc = await db.collection('menuItems').doc(id).get();
        if (!doc.exists) {
            alert('Item not found');
            return;
        }
        
        const item = doc.data();
        editingItemId = id;
        
        // Fill form
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemImage').value = item.image || '';
        document.getElementById('itemAvailable').checked = item.available;
        
        // Show image preview if exists
        if (item.image) {
            showImagePreview(item.image);
        }
        
        // Update button
        document.getElementById('addItemForm').querySelector('button[type="submit"]').textContent = 'Update Item';
        document.getElementById('cancelEdit').classList.remove('hidden');
        
        // Scroll to form
        document.querySelector('#addItemForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editing item:', error);
        alert('Error loading item details');
    }
};

// Delete item
window.deleteItem = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
    }
    
    try {
        await db.collection('menuItems').doc(id).delete();
        alert('Item deleted successfully!');
        loadMenuItems();
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
    }
};

// ==================== OFFERS MANAGEMENT ====================

let editingOfferId = null;

// Add/Edit Offer
document.getElementById('addOfferForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const offerData = {
        title: document.getElementById('offerTitle').value,
        description: document.getElementById('offerDescription').value,
        price: document.getElementById('offerPrice').value,
        badge: document.getElementById('offerBadge').value,
        active: document.getElementById('offerActive').checked,
        updatedAt: new Date().toISOString()
    };
    
    submitBtn.disabled = true;
    submitBtn.textContent = editingOfferId ? 'Updating...' : 'Adding...';
    
    try {
        if (editingOfferId) {
            await db.collection('offers').doc(editingOfferId).update(offerData);
            alert('Offer updated successfully!');
        } else {
            offerData.createdAt = new Date().toISOString();
            await db.collection('offers').add(offerData);
            alert('Offer added successfully!');
        }
        
        // Reset form
        e.target.reset();
        editingOfferId = null;
        document.getElementById('cancelOfferEdit').classList.add('hidden');
        submitBtn.textContent = 'Add Offer';
        
        // Reload offers
        loadOffers();
    } catch (error) {
        console.error('Error saving offer:', error);
        alert('Error saving offer. Please try again.');
    } finally {
        submitBtn.disabled = false;
    }
});

// Cancel offer edit
document.getElementById('cancelOfferEdit').addEventListener('click', () => {
    document.getElementById('addOfferForm').reset();
    editingOfferId = null;
    document.getElementById('cancelOfferEdit').classList.add('hidden');
    document.getElementById('addOfferForm').querySelector('button[type="submit"]').textContent = 'Add Offer';
});

// Load offers
async function loadOffers() {
    const offersList = document.getElementById('offersList');
    
    try {
        const snapshot = await db.collection('offers').orderBy('createdAt', 'desc').get();
        
        if (snapshot.empty) {
            offersList.innerHTML = '<p class="text-gray-500 text-center py-8">No offers found</p>';
            return;
        }
        
        offersList.innerHTML = snapshot.docs.map(doc => {
            const offer = doc.data();
            return createOfferCard(doc.id, offer);
        }).join('');
    } catch (error) {
        console.error('Error loading offers:', error);
        offersList.innerHTML = '<p class="text-red-500 text-center py-8">Error loading offers</p>';
    }
}

// Create offer card
function createOfferCard(id, offer) {
    return `
        <div class="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <h3 class="font-bold text-gray-900">${offer.title}</h3>
                        ${offer.badge ? `<span class="px-2 py-1 text-xs bg-red-500 text-white rounded-full">${offer.badge}</span>` : ''}
                    </div>
                    <p class="text-gray-600 mt-1">${offer.description}</p>
                    <p class="text-orange-600 font-bold mt-2">${offer.price}</p>
                    <div class="flex items-center space-x-2 mt-2">
                        <span class="px-2 py-1 text-xs rounded-full ${offer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                            ${offer.active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="flex space-x-2 mt-3">
                <button onclick="editOffer('${id}')" class="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                    Edit
                </button>
                <button onclick="deleteOffer('${id}', '${offer.title}')" class="text-red-600 hover:text-red-700 text-sm font-semibold">
                    Delete
                </button>
            </div>
        </div>
    `;
}

// Edit offer
window.editOffer = async (id) => {
    try {
        const doc = await db.collection('offers').doc(id).get();
        if (!doc.exists) {
            alert('Offer not found');
            return;
        }
        
        const offer = doc.data();
        editingOfferId = id;
        
        // Fill form
        document.getElementById('offerTitle').value = offer.title;
        document.getElementById('offerDescription').value = offer.description;
        document.getElementById('offerPrice').value = offer.price;
        document.getElementById('offerBadge').value = offer.badge || '';
        document.getElementById('offerActive').checked = offer.active;
        
        // Update button
        document.getElementById('addOfferForm').querySelector('button[type="submit"]').textContent = 'Update Offer';
        document.getElementById('cancelOfferEdit').classList.remove('hidden');
        
        // Switch to offers tab
        document.querySelector('[data-tab="offers"]').click();
        document.querySelector('#addOfferForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editing offer:', error);
        alert('Error loading offer details');
    }
};

// Delete offer
window.deleteOffer = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
        return;
    }
    
    try {
        await db.collection('offers').doc(id).delete();
        alert('Offer deleted successfully!');
        loadOffers();
    } catch (error) {
        console.error('Error deleting offer:', error);
        alert('Error deleting offer. Please try again.');
    }
};

// ==================== SETTINGS ====================

// Change password
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    try {
        const user = auth.currentUser;
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email,
            currentPassword
        );
        
        // Reauthenticate
        await user.reauthenticateWithCredential(credential);
        
        // Update password
        await user.updatePassword(newPassword);
        
        alert('Password updated successfully!');
        e.target.reset();
    } catch (error) {
        console.error('Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
            alert('Current password is incorrect');
        } else {
            alert('Error changing password. Please try again.');
        }
    }
});

// Download backup
document.getElementById('downloadBackupBtn').addEventListener('click', async () => {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            menuItems: [],
            offers: []
        };
        
        // Get all menu items
        const itemsSnapshot = await db.collection('menuItems').get();
        itemsSnapshot.forEach(doc => {
            backup.menuItems.push({ id: doc.id, ...doc.data() });
        });
        
        // Get all offers
        const offersSnapshot = await db.collection('offers').get();
        offersSnapshot.forEach(doc => {
            backup.offers.push({ id: doc.id, ...doc.data() });
        });
        
        // Create download link
        const dataStr = JSON.stringify(backup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `shreevari-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        alert('Backup downloaded successfully!');
    } catch (error) {
        console.error('Error downloading backup:', error);
        alert('Error creating backup. Please try again.');
    }
});

// ========================================
// OFFER BANNERS MANAGEMENT
// ========================================

// Load Banners
async function loadBanners() {
    const bannersList = document.getElementById('bannersList');
    
    try {
        const bannersSnapshot = await db.collection('offerBanners')
            .orderBy('order')
            .get();

        if (bannersSnapshot.empty) {
            bannersList.innerHTML = '<p class="text-gray-500 text-center py-8">No banners yet. Add your first banner!</p>';
            return;
        }

        let bannersHTML = '';
        bannersSnapshot.forEach(doc => {
            const banner = doc.data();
            const imagePreview = banner.image ? 
                `<img src="${banner.image}" alt="${banner.title}" class="w-full h-32 object-cover rounded-lg mb-3">` : '';
            
            bannersHTML += `
                <div class="bg-gradient-to-r from-gray-900 to-black text-white p-4 rounded-xl">
                    ${imagePreview}
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-yellow-400">${banner.title}</h3>
                            ${banner.description ? `<p class="text-gray-300 text-sm mt-1">${banner.description}</p>` : ''}
                            <div class="flex gap-3 mt-2 text-xs text-gray-400">
                                <span>Order: ${banner.order}</span>
                                <span class="${banner.active ? 'text-green-400' : 'text-red-400'}">
                                    ${banner.active ? '● Active' : '○ Inactive'}
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-2 ml-4">
                            <button onclick="editBanner('${doc.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                                Edit
                            </button>
                            <button onclick="deleteBanner('${doc.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        bannersList.innerHTML = bannersHTML;
    } catch (error) {
        console.error('Error loading banners:', error);
        bannersList.innerHTML = '<p class="text-red-500 text-center">Error loading banners</p>';
    }
}

// Add/Update Banner
document.getElementById('addBannerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bannerId = document.getElementById('editBannerId').value;
    const title = document.getElementById('bannerTitle').value;
    const description = document.getElementById('bannerDescription').value;
    const image = document.getElementById('bannerImage').value;
    const order = parseInt(document.getElementById('bannerOrder').value);
    const active = document.getElementById('bannerActive').checked;
    
    const bannerData = {
        title,
        description,
        image,
        order,
        active,
        updatedAt: new Date().toISOString()
    };
    
    try {
        if (bannerId) {
            await db.collection('offerBanners').doc(bannerId).update(bannerData);
            alert('Banner updated successfully!');
        } else {
            bannerData.createdAt = new Date().toISOString();
            await db.collection('offerBanners').add(bannerData);
            alert('Banner added successfully!');
        }
        
        document.getElementById('addBannerForm').reset();
        document.getElementById('editBannerId').value = '';
        document.getElementById('cancelBannerEdit').classList.add('hidden');
        document.getElementById('bannerImagePreview').classList.add('hidden');
        loadBanners();
    } catch (error) {
        console.error('Error saving banner:', error);
        alert('Error saving banner. Please try again.');
    }
});

// Edit Banner
async function editBanner(bannerId) {
    try {
        const doc = await db.collection('offerBanners').doc(bannerId).get();
        const banner = doc.data();
        
        document.getElementById('editBannerId').value = bannerId;
        document.getElementById('bannerTitle').value = banner.title;
        document.getElementById('bannerDescription').value = banner.description || '';
        document.getElementById('bannerImage').value = banner.image || '';
        document.getElementById('bannerOrder').value = banner.order;
        document.getElementById('bannerActive').checked = banner.active;
        
        if (banner.image) {
            document.getElementById('bannerPreviewImg').src = banner.image;
            document.getElementById('bannerImagePreview').classList.remove('hidden');
        }
        
        document.getElementById('cancelBannerEdit').classList.remove('hidden');
        document.querySelector('button[data-tab="banners"]').click();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading banner:', error);
        alert('Error loading banner');
    }
}

// Delete Banner
async function deleteBanner(bannerId) {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
        await db.collection('offerBanners').doc(bannerId).delete();
        alert('Banner deleted successfully!');
        loadBanners();
    } catch (error) {
        console.error('Error deleting banner:', error);
        alert('Error deleting banner');
    }
}

// Banner Image Upload
document.getElementById('uploadBannerImageBtn').addEventListener('click', () => {
    document.getElementById('bannerImageFile').click();
});

document.getElementById('bannerImageFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const result = await CloudinaryHelper.uploadImage(file);
        document.getElementById('bannerImage').value = result.url;
        document.getElementById('bannerPreviewImg').src = result.url;
        document.getElementById('bannerImagePreview').classList.remove('hidden');
        alert('Image uploaded successfully!');
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image. Please try again.');
    }
});

// Cancel Banner Edit
document.getElementById('cancelBannerEdit').addEventListener('click', () => {
    document.getElementById('addBannerForm').reset();
    document.getElementById('editBannerId').value = '';
    document.getElementById('cancelBannerEdit').classList.add('hidden');
    document.getElementById('bannerImagePreview').classList.add('hidden');
});

// Load banners when banners tab is clicked
document.querySelector('button[data-tab="banners"]').addEventListener('click', loadBanners);
// ========================================
// ORDERS MANAGEMENT
// ========================================

// Load Orders
async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    
    try {
        const ordersSnapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        if (ordersSnapshot.empty) {
            ordersList.innerHTML = '<p class="text-gray-500 text-center py-8">No orders yet.</p>';
            return;
        }

        let ordersHTML = '';
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            const statusColor = {
                'pending': 'bg-yellow-100 text-yellow-800',
                'accepted': 'bg-blue-100 text-blue-800',
                'preparing': 'bg-purple-100 text-purple-800',
                'out_for_delivery': 'bg-orange-100 text-orange-800',
                'delivered': 'bg-green-100 text-green-800',
                'cancelled': 'bg-red-100 text-red-800'
            }[order.status] || 'bg-gray-100 text-gray-800';
            
            ordersHTML += `
                <div class="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="font-bold text-lg">${order.customerName}</h3>
                            <p class="text-sm text-gray-600">📞 ${order.phone}</p>
                            <p class="text-sm text-gray-600">📍 ${order.address}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${statusColor}">
                            ${order.status ? order.status.replace('_', ' ').toUpperCase() : 'PENDING'}
                        </span>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-3 mb-3">
                        <p class="text-sm font-semibold text-gray-700">Order Details:</p>
                        <p class="text-sm text-gray-600 whitespace-pre-line">${order.orderDetails}</p>
                    </div>
                    
                    <div class="flex justify-between items-center mb-3">
                        <div>
                            <p class="text-sm text-gray-600">Amount: <span class="font-bold text-gray-900">₹${order.amount}</span></p>
                            <p class="text-sm text-gray-600">Payment: <span class="font-semibold ${order.paymentStatus === 'received' ? 'text-green-600' : 'text-yellow-600'}">${order.paymentStatus || 'Pending'}</span></p>
                        </div>
                        ${order.deliveryTime ? `
                            <div class="text-right">
                                <p class="text-sm text-gray-600">Delivery Time:</p>
                                <p class="font-bold text-orange-600">${order.deliveryTime}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex gap-2">
                        ${!order.deliveryTime ? `
                            <button onclick="setDeliveryTime('${doc.id}')" 
                                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                                ⏰ Set Delivery Time
                            </button>
                        ` : ''}
                        
                        <button onclick="updateOrderStatus('${doc.id}', '${order.status}')" 
                                class="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                            Update Status
                        </button>
                        
                        <button onclick="deleteOrder('${doc.id}')" 
                                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        });

        ordersList.innerHTML = ordersHTML;
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<p class="text-red-500 text-center">Error loading orders</p>';
    }
}

// Add Order (Manual Entry from WhatsApp)
document.getElementById('addOrderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const orderData = {
        customerName: document.getElementById('orderCustomerName').value,
        phone: document.getElementById('orderPhone').value,
        orderDetails: document.getElementById('orderDetails').value,
        address: document.getElementById('orderAddress').value,
        amount: parseFloat(document.getElementById('orderAmount').value),
        paymentStatus: document.getElementById('orderPaymentStatus').value,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    try {
        await db.collection('orders').add(orderData);
        alert('Order added successfully!');
        document.getElementById('addOrderForm').reset();
        loadOrders();
    } catch (error) {
        console.error('Error adding order:', error);
        alert('Error adding order');
    }
});

// Set Delivery Time
async function setDeliveryTime(orderId) {
    const time = prompt('Enter delivery time (e.g., "30 minutes", "1 hour", "2:30 PM"):');
    
    if (!time) return;
    
    try {
        await db.collection('orders').doc(orderId).update({
            deliveryTime: time,
            status: 'accepted'
        });
        
        // Get order details to send WhatsApp notification
        const orderDoc = await db.collection('orders').doc(orderId).get();
        const order = orderDoc.data();
        
        // Send delivery time to customer via WhatsApp
        const message = encodeURIComponent(
            `🎉 Order Confirmed - Shreevari Snacks\n\n` +
            `Dear ${order.customerName},\n\n` +
            `Your order has been confirmed!\n` +
            `Estimated Delivery Time: ${time}\n\n` +
            `Order Amount: ₹${order.amount}\n` +
            `Delivery Address: ${order.address}\n\n` +
            `Thank you for ordering! 😊`
        );
        
        const whatsappURL = `https://wa.me/${order.phone}?text=${message}`;
        window.open(whatsappURL, '_blank');
        
        alert('Delivery time set! WhatsApp message opened.');
        loadOrders();
    } catch (error) {
        console.error('Error setting delivery time:', error);
        alert('Error setting delivery time');
    }
}

// Update Order Status
async function updateOrderStatus(orderId, currentStatus) {
    const statuses = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    const statusLabels = ['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    
    let options = '';
    statuses.forEach((status, index) => {
        options += `${index + 1}. ${statusLabels[index]}\n`;
    });
    
    const choice = prompt(`Select new status:\n${options}\nEnter number (1-6):`);
    
    if (!choice || choice < 1 || choice > 6) return;
    
    const newStatus = statuses[choice - 1];
    
    try {
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
        
        alert('Order status updated!');
        loadOrders();
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status');
    }
}

// Delete Order
async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
        await db.collection('orders').doc(orderId).delete();
        alert('Order deleted!');
        loadOrders();
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order');
    }
}

// Load orders when orders tab is clicked
document.querySelector('button[data-tab="orders"]').addEventListener('click', loadOrders);
