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
        image: document.getElementById('itemImage').value,
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
        
        // Add event listeners to edit and delete buttons
        attachItemEventListeners();
    } catch (error) {
        console.error('Error loading items:', error);
        itemsList.innerHTML = '<p class="text-red-500 text-center py-8">Error loading items</p>';
    }
}

// Create Item Card HTML
function createItemCard(id, item) {
    const statusColor = item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    const statusText = item.available ? 'Available' : 'Unavailable';
    
    return `
        <div class="admin-item-card">
            <div class="flex justify-between items-start gap-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <h3 class="text-lg font-bold text-gray-900">${item.name}</h3>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColor}">${statusText}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${item.description || 'No description'}</p>
                    <div class="flex items-center gap-4 text-sm">
                        <span class="font-semibold text-orange-600">₹${item.price}</span>
                        <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">${item.category}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="edit-item-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition" data-id="${id}">
                        Edit
                    </button>
                    <button class="delete-item-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition" data-id="${id}">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Attach Event Listeners to Item Buttons
function attachItemEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const itemId = btn.dataset.id;
            try {
                const doc = await db.collection('menuItems').doc(itemId).get();
                if (doc.exists) {
                    const item = doc.data();
                    
                    // Populate form
                    document.getElementById('itemName').value = item.name;
                    document.getElementById('itemCategory').value = item.category;
                    document.getElementById('itemDescription').value = item.description || '';
                    document.getElementById('itemPrice').value = item.price;
                    document.getElementById('itemImage').value = item.image || '';
                    document.getElementById('itemAvailable').checked = item.available;
                    
                    editingItemId = itemId;
                    document.getElementById('editItemId').value = itemId;
                    document.getElementById('cancelEdit').classList.remove('hidden');
                    document.getElementById('addItemForm').querySelector('button[type="submit"]').textContent = 'Update Item';
                    
                    // Scroll to form
                    document.getElementById('addItemForm').scrollIntoView({ behavior: 'smooth' });
                }
            } catch (error) {
                console.error('Error loading item:', error);
                alert('Error loading item. Please try again.');
            }
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this item?')) return;
            
            const itemId = btn.dataset.id;
            try {
                await db.collection('menuItems').doc(itemId).delete();
                alert('Item deleted successfully!');
                loadMenuItems();
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('Error deleting item. Please try again.');
            }
        });
    });
}

// Filter Category Change
document.getElementById('filterCategory').addEventListener('change', loadMenuItems);

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
            // Update existing offer
            await db.collection('offers').doc(editingOfferId).update(offerData);
            alert('Offer updated successfully!');
        } else {
            // Add new offer
            offerData.createdAt = new Date().toISOString();
            await db.collection('offers').add(offerData);
            alert('Offer added successfully!');
        }
        
        // Reset form
        e.target.reset();
        editingOfferId = null;
        document.getElementById('editOfferId').value = '';
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

// Cancel Offer Edit
document.getElementById('cancelOfferEdit').addEventListener('click', () => {
    document.getElementById('addOfferForm').reset();
    editingOfferId = null;
    document.getElementById('editOfferId').value = '';
    document.getElementById('cancelOfferEdit').classList.add('hidden');
    document.getElementById('addOfferForm').querySelector('button[type="submit"]').textContent = 'Add Offer';
});

// Load Offers
async function loadOffers() {
    const offersList = document.getElementById('offersList');
    
    try {
        const snapshot = await db.collection('offers')
            .orderBy('createdAt', 'desc')
            .get();
        
        if (snapshot.empty) {
            offersList.innerHTML = '<p class="text-gray-500 text-center py-8">No offers found</p>';
            return;
        }
        
        offersList.innerHTML = snapshot.docs.map(doc => {
            const offer = doc.data();
            return createOfferCard(doc.id, offer);
        }).join('');
        
        // Add event listeners to edit and delete buttons
        attachOfferEventListeners();
    } catch (error) {
        console.error('Error loading offers:', error);
        offersList.innerHTML = '<p class="text-red-500 text-center py-8">Error loading offers</p>';
    }
}

// Create Offer Card HTML
function createOfferCard(id, offer) {
    const statusColor = offer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    const statusText = offer.active ? 'Active' : 'Inactive';
    
    return `
        <div class="admin-item-card">
            <div class="flex justify-between items-start gap-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-3 py-1 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full text-xs font-bold">${offer.badge}</span>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColor}">${statusText}</span>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">${offer.title}</h3>
                    <p class="text-sm text-gray-600 mb-2">${offer.description}</p>
                    <div class="text-xl font-black text-orange-600">${offer.price}</div>
                </div>
                <div class="flex gap-2">
                    <button class="edit-offer-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition" data-id="${id}">
                        Edit
                    </button>
                    <button class="delete-offer-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition" data-id="${id}">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Attach Event Listeners to Offer Buttons
function attachOfferEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-offer-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const offerId = btn.dataset.id;
            try {
                const doc = await db.collection('offers').doc(offerId).get();
                if (doc.exists) {
                    const offer = doc.data();
                    
                    // Populate form
                    document.getElementById('offerTitle').value = offer.title;
                    document.getElementById('offerDescription').value = offer.description;
                    document.getElementById('offerPrice').value = offer.price;
                    document.getElementById('offerBadge').value = offer.badge;
                    document.getElementById('offerActive').checked = offer.active;
                    
                    editingOfferId = offerId;
                    document.getElementById('editOfferId').value = offerId;
                    document.getElementById('cancelOfferEdit').classList.remove('hidden');
                    document.getElementById('addOfferForm').querySelector('button[type="submit"]').textContent = 'Update Offer';
                    
                    // Scroll to form
                    document.getElementById('addOfferForm').scrollIntoView({ behavior: 'smooth' });
                }
            } catch (error) {
                console.error('Error loading offer:', error);
                alert('Error loading offer. Please try again.');
            }
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-offer-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this offer?')) return;
            
            const offerId = btn.dataset.id;
            try {
                await db.collection('offers').doc(offerId).delete();
                alert('Offer deleted successfully!');
                loadOffers();
            } catch (error) {
                console.error('Error deleting offer:', error);
                alert('Error deleting offer. Please try again.');
            }
        });
    });
}

// ==================== SETTINGS ====================

// Change Password
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const passwordMessage = document.getElementById('passwordMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // Check if new passwords match
    if (newPassword !== confirmNewPassword) {
        passwordMessage.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800';
        passwordMessage.textContent = 'New passwords do not match!';
        passwordMessage.classList.remove('hidden');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    try {
        const user = auth.currentUser;
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email,
            currentPassword
        );
        
        // Re-authenticate user
        await user.reauthenticateWithCredential(credential);
        
        // Update password
        await user.updatePassword(newPassword);
        
        passwordMessage.className = 'mt-4 p-4 rounded-lg bg-green-100 text-green-800';
        passwordMessage.textContent = 'Password updated successfully!';
        passwordMessage.classList.remove('hidden');
        
        // Reset form
        e.target.reset();
        
        setTimeout(() => {
            passwordMessage.classList.add('hidden');
        }, 5000);
    } catch (error) {
        console.error('Password change error:', error);
        
        let errorMessage = 'Error updating password. Please try again.';
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Current password is incorrect.';
        }
        
        passwordMessage.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800';
        passwordMessage.textContent = errorMessage;
        passwordMessage.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Password';
    }
});

// Backup Data
document.getElementById('backupBtn').addEventListener('click', async () => {
    try {
        const menuSnapshot = await db.collection('menuItems').get();
        const offersSnapshot = await db.collection('offers').get();
        
        const backup = {
            menuItems: menuSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            offers: offersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            backupDate: new Date().toISOString()
        };
        
        // Create and download JSON file
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shreevari-snacks-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        alert('Backup downloaded successfully!');
    } catch (error) {
        console.error('Backup error:', error);
        alert('Error creating backup. Please try again.');
    }
});
