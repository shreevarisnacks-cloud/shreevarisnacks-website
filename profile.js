// ========================================
// CUSTOMER PROFILE PAGE
// ========================================

let currentUser = null;

// Check authentication
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        // Not logged in - redirect to login
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    await loadUserProfile(user);
    await loadUserOrders(user.uid);
});

// Load user profile
async function loadUserProfile(user) {
    try {
        // Get user data from Firestore
        const userDoc = await db.collection('customers').doc(user.uid).get();
        const userData = userDoc.data() || {};
        
        // Display user info
        document.getElementById('userName').textContent = userData.name || user.email.split('@')[0];
        document.getElementById('userEmail').textContent = user.email;
        
        // Set initial
        const initial = (userData.name || user.email)[0].toUpperCase();
        document.getElementById('userInitial').textContent = initial;
        
        // Populate form fields if they exist
        if (document.getElementById('profileName')) {
            document.getElementById('profileName').value = userData.name || '';
        }
        if (document.getElementById('profileEmail')) {
            document.getElementById('profileEmail').value = user.email;
        }
        if (document.getElementById('profilePhone')) {
            document.getElementById('profilePhone').value = userData.phone || '';
        }
        if (document.getElementById('profileAddress')) {
            document.getElementById('profileAddress').value = userData.address || '';
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load user orders
async function loadUserOrders(userId) {
    const ordersList = document.getElementById('ordersList');
    
    try {
        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        
        if (ordersSnapshot.empty) {
            ordersList.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">📦</div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">No orders yet</h3>
                    <p class="text-gray-600 mb-6">Start ordering delicious food!</p>
                    <a href="menu.html" class="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold transition">
                        Browse Menu
                    </a>
                </div>
            `;
            return;
        }
        
        let ordersHTML = '';
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            ordersHTML += createOrderCard(doc.id, order);
        });
        
        ordersList.innerHTML = ordersHTML;
        
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<p class="text-red-500 text-center">Error loading orders</p>';
    }
}

// Create order card HTML
function createOrderCard(orderId, order) {
    const statusColors = {
        'pending_verification': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
        'verified': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '✓' },
        'preparing': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '👨‍🍳' },
        'out_for_delivery': { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🚗' },
        'delivered': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
        'rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' }
    };
    
    const status = statusColors[order.status] || statusColors['pending_verification'];
    const statusLabel = (order.status || 'pending_verification').replace(/_/g, ' ').toUpperCase();
    
    let itemsHTML = '';
    if (order.orderItems && Array.isArray(order.orderItems)) {
        itemsHTML = order.orderItems.map(item => 
            `<div class="text-sm text-gray-600">${item.quantity}x ${item.name} - ₹${item.price * item.quantity}</div>`
        ).join('');
    }
    
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : 'N/A';
    
    return `
        <div class="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-bold text-gray-900">Order #${order.orderNumber || orderId.substring(0, 8)}</h3>
                    <p class="text-sm text-gray-500">${orderDate}</p>
                </div>
                <span class="px-4 py-2 rounded-full text-sm font-bold ${status.bg} ${status.text}">
                    ${status.icon} ${statusLabel}
                </span>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <p class="font-semibold text-gray-700 mb-2">Items:</p>
                ${itemsHTML}
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p class="text-sm text-gray-600">Subtotal</p>
                    <p class="font-bold text-gray-900">₹${order.subtotal || 0}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Delivery</p>
                    <p class="font-bold text-gray-900">₹${order.deliveryCharge || 0}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Total Amount</p>
                    <p class="font-bold text-orange-600 text-lg">₹${order.totalAmount || 0}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Payment Status</p>
                    <p class="font-bold ${order.paymentVerified ? 'text-green-600' : 'text-yellow-600'}">
                        ${order.paymentVerified ? '✓ Verified' : '⏳ Pending'}
                    </p>
                </div>
            </div>
            
            ${order.deliveryTime ? `
                <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p class="text-sm font-semibold text-green-900">⏰ Delivery Time: ${order.deliveryTime}</p>
                </div>
            ` : ''}
            
            ${order.status === 'rejected' ? `
                <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p class="text-sm font-semibold text-red-900">Order Rejected</p>
                    <p class="text-xs text-red-700">${order.rejectionReason || 'Payment verification failed'}</p>
                </div>
            ` : ''}
            
            <div class="flex gap-3">
                <button onclick="viewOrderDetails('${orderId}')" 
                        class="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                    View Details
                </button>
                ${order.status === 'delivered' ? `
                    <button onclick="reorder('${orderId}')" 
                            class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                        Reorder
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// View order details
function viewOrderDetails(orderId) {
    // TODO: Show modal with full order details
    alert('Order details will be shown here');
}

// Reorder
async function reorder(orderId) {
    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        const order = orderDoc.data();
        
        if (!order || !order.orderItems) {
            alert('Cannot reorder this order');
            return;
        }
        
        // Clear current cart
        cart.clearCart();
        
        // Add items to cart
        order.orderItems.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                cart.addItem(item);
            }
        });
        
        alert('Items added to cart! Go to cart to checkout.');
        window.location.href = 'cart.html';
        
    } catch (error) {
        console.error('Error reordering:', error);
        alert('Error adding items to cart');
    }
}

// Filter orders
function filterOrders(status) {
    const allOrders = document.querySelectorAll('#ordersList > div');
    
    allOrders.forEach(orderCard => {
        if (status === 'all') {
            orderCard.style.display = 'block';
        } else {
            const orderStatus = orderCard.querySelector('[class*="bg-"]')?.textContent.toLowerCase();
            if (orderStatus && orderStatus.includes(status.replace('_', ' '))) {
                orderCard.style.display = 'block';
            } else {
                orderCard.style.display = 'none';
            }
        }
    });
}

// Update profile
document.getElementById('updateProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;
    const address = document.getElementById('profileAddress').value;
    
    try {
        await db.collection('customers').doc(currentUser.uid).set({
            name: name,
            phone: phone,
            address: address,
            email: currentUser.email,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        alert('✓ Profile updated successfully!');
        loadUserProfile(currentUser);
        
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile');
    }
});

// Change password
document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    
    try {
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
        );
        await currentUser.reauthenticateWithCredential(credential);
        
        // Update password
        await currentUser.updatePassword(newPassword);
        
        alert('✓ Password changed successfully!');
        document.getElementById('changePasswordForm').reset();
        
    } catch (error) {
        console.error('Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
            alert('Current password is incorrect');
        } else {
            alert('Error changing password');
        }
    }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
});

document.getElementById('logoutBtnMobile')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
});
