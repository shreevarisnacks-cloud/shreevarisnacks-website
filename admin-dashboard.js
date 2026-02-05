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
