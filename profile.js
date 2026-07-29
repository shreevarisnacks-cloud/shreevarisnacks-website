// ========================================
// PROFILE PAGE - LOAD ORDERS WITH TRACKING
// ========================================

console.log('👤 Loading profile page...');

// Wait for Firebase to load
function waitForFirebase(callback, attempts = 0) {
    if (attempts > 10) {
        alert('System error. Please refresh page.');
        return;
    }
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForFirebase(callback, attempts + 1), 500);
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    waitForFirebase(() => {
        setupProfile();
    });
});

// ========================================
// SETUP PROFILE
// ========================================

function setupProfile() {
    console.log('👤 Setting up profile...');
    
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ User logged in:', user.email);
            loadUserInfo(user);
            loadOrders(user.uid);
        } else {
            console.log('❌ User not logged in');
            alert('Please login first');
            window.location.href = 'login.html';
        }
    });
}

// ========================================
// LOAD USER INFO
// ========================================

function loadUserInfo(user) {
    console.log('👤 Loading user info...');
    
    db.collection('customers').doc(user.uid).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            
            document.getElementById('userName').textContent = data.name || user.email;
            document.getElementById('userEmail').textContent = user.email;
            
            // Set initial
            if (data.name) {
                document.getElementById('userInitial').textContent = data.name.charAt(0).toUpperCase();
            }
            
            console.log('✅ User info loaded');
        } else {
            document.getElementById('userName').textContent = user.email;
            document.getElementById('userEmail').textContent = 'Account created';
        }
    });
}

// ========================================
// LOAD ORDERS
// ========================================

function loadOrders(userId) {
    console.log('📦 Loading orders for user:', userId);
    
    const ordersList = document.getElementById('ordersList');
    
    db.collection('orders')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .onSnapshot((querySnapshot) => {
            console.log(`📦 Found ${querySnapshot.docs.length} orders`);
            
            if (querySnapshot.empty) {
                ordersList.innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-gray-500 text-lg">No orders yet</p>
                        <a href="menu.html" class="inline-block mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">
                            🍽️ Start Ordering
                        </a>
                    </div>
                `;
                return;
            }
            
            ordersList.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const order = doc.data();
                const orderCard = createOrderCard(doc.id, order);
                ordersList.appendChild(orderCard);
            });
        }, (error) => {
            console.error('❌ Error loading orders:', error);
            ordersList.innerHTML = `<p class="text-red-500">Error loading orders: ${error.message}</p>`;
        });
}

// ========================================
// CREATE ORDER CARD WITH TRACKING BUTTON
// ========================================

function createOrderCard(orderId, order) {
    const statusColor = {
        'pending_verification': 'bg-yellow-50 border-yellow-400',
        'verified': 'bg-blue-50 border-blue-400',
        'preparing': 'bg-purple-50 border-purple-400',
        'out_for_delivery': 'bg-orange-50 border-orange-400',
        'delivered': 'bg-green-50 border-green-400',
        'rejected': 'bg-red-50 border-red-400'
    };
    
    const statusEmoji = {
        'pending_verification': '⏳',
        'verified': '✅',
        'preparing': '👨‍🍳',
        'out_for_delivery': '🚗',
        'delivered': '🎉',
        'rejected': '❌'
    };
    
    const statusText = {
        'pending_verification': 'Pending Verification',
        'verified': 'Verified',
        'preparing': 'Preparing',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'rejected': 'Rejected'
    };
    
    const borderClass = statusColor[order.status] || statusColor['pending_verification'];
    const emoji = statusEmoji[order.status] || '⏳';
    const statusDisplay = statusText[order.status] || order.status;
    
    const card = document.createElement('div');
    card.className = `border-2 ${borderClass} rounded-xl p-6 mb-4`;
    
    // Items list
    const itemsList = (order.orderItems || [])
        .map(item => `<li class="text-sm text-gray-600">• ${item.quantity}x ${item.name} @ ₹${item.price}</li>`)
        .join('');
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <p class="font-bold text-lg text-gray-900">Order #${order.orderNumber}</p>
                <p class="text-xs text-gray-600">${new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <span class="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-bold">
                ${emoji} ${statusDisplay}
            </span>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mb-4 bg-white p-3 rounded-lg">
            <div>
                <p class="text-xs text-gray-600">Amount</p>
                <p class="font-bold text-orange-600">₹${order.totalAmount}</p>
            </div>
            <div>
                <p class="text-xs text-gray-600">Delivery</p>
                <p class="font-bold">${order.deliveryTime || 'Pending'}</p>
            </div>
            ${order.distance ? `
            <div>
                <p class="text-xs text-gray-600">Distance</p>
                <p class="font-bold">${order.distance}km</p>
            </div>
            ` : ''}
            <div>
                <p class="text-xs text-gray-600">Address</p>
                <p class="text-xs font-bold line-clamp-1">${order.address || 'N/A'}</p>
            </div>
        </div>
        
        <div class="mb-3">
            <p class="font-bold text-gray-700 mb-2">Items:</p>
            <ul class="list-none space-y-1">
                ${itemsList}
            </ul>
        </div>
        
        <div class="flex gap-3 mt-4">
            <!-- TRACKING BUTTON - NEW! -->
            <a href="delivery-tracking-FREE.html?orderId=${orderId}" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg text-center transition">
                🗺️ Track Order
            </a>
            
            <!-- VIEW DETAILS BUTTON -->
            <button onclick="viewOrderDetails('${orderId}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
                📋 Details
            </button>
        </div>
    `;
    
    return card;
}

// ========================================
// VIEW ORDER DETAILS (MODAL)
// ========================================

function viewOrderDetails(orderId) {
    console.log('📋 Viewing order details:', orderId);
    
    db.collection('orders').doc(orderId).get().then(doc => {
        if (!doc.exists) {
            alert('Order not found');
            return;
        }
        
        const order = doc.data();
        
        const itemsList = (order.orderItems || [])
            .map(item => `<li class="text-sm text-gray-700">• ${item.quantity}x ${item.name} - ₹${item.price * item.quantity}</li>`)
            .join('');
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.onclick = () => modal.remove();
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-2xl w-full max-h-96 overflow-auto p-6" onclick="event.stopPropagation()">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold">Order #${order.orderNumber}</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-2xl font-bold cursor-pointer">✕</button>
                </div>
                
                <div class="mb-4">
                    <p class="text-sm text-gray-600">Order Date: ${new Date(order.createdAt).toLocaleString()}</p>
                    <p class="text-sm text-gray-600">Status: ${order.status}</p>
                </div>
                
                <div class="border-t pt-4 mb-4">
                    <h3 class="font-bold mb-2">Items:</h3>
                    <ul class="list-none space-y-1">
                        ${itemsList}
                    </ul>
                </div>
                
                <div class="border-t pt-4 mb-4">
                    <p class="text-sm text-gray-600">Subtotal: <span class="font-bold">₹${order.subtotal}</span></p>
                    <p class="text-sm text-gray-600">Delivery: <span class="font-bold">₹${order.deliveryCharge}</span></p>
                    <p class="text-lg font-bold text-orange-600 mt-2">Total: ₹${order.totalAmount}</p>
                </div>
                
                <div class="border-t pt-4 mb-4">
                    <p class="text-sm font-bold">Delivery Address:</p>
                    <p class="text-sm text-gray-700">${order.address}</p>
                </div>
                
                <div class="flex gap-2 mt-4">
                    <a href="delivery-tracking-FREE.html?orderId=${orderId}" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg text-center">
                        🗺️ Track
                    </a>
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    });
}

// ========================================
// LOGOUT
// ========================================

document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        console.log('✅ Logged out');
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('❌ Logout error:', error);
        alert('Error logging out');
    });
});

console.log('✅ Profile script loaded');
