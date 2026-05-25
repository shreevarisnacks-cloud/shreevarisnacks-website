// ========================================
// SECURE CART PAGE - LOGIN REQUIRED
// Orders go to admin dashboard only
// ========================================

const RESTAURANT_LOCATION = {
    lat: 13.520935985883005,
    lng: 77.237526720881
};

let customerLocation = null;
let deliveryCharge = 0;
let paymentScreenshot = null;
let expectedAmount = 0;
let currentUser = null;

// Check if user is logged in
auth.onAuthStateChanged((user) => {
    if (!user) {
        // Not logged in - redirect to login
        alert('⚠️ Please login to place an order');
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
});

// Display cart items
function displayCartItems() {
    const container = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const checkoutSection = document.getElementById('checkoutSection');
    
    if (cart.items.length === 0) {
        container.classList.add('hidden');
        emptyCart.classList.remove('hidden');
        checkoutSection.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    emptyCart.classList.add('hidden');
    checkoutSection.classList.remove('hidden');
    
    container.innerHTML = cart.items.map(item => `
        <div class="bg-white rounded-xl shadow-lg p-4 flex gap-4">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0">` : 
              `<div class="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-3xl md:text-4xl flex-shrink-0">🍕</div>`}
            
            <div class="flex-1 min-w-0">
                <h3 class="text-base md:text-lg font-bold text-gray-900 truncate">${item.name}</h3>
                <p class="text-orange-600 font-bold text-lg md:text-xl">₹${item.price}</p>
                
                <div class="flex items-center gap-2 md:gap-3 mt-2 md:mt-3">
                    <button onclick="updateItemQuantity('${item.id}', ${item.quantity - 1})" 
                            class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg font-bold transition">-</button>
                    <span class="font-bold text-base md:text-lg w-8 text-center">${item.quantity}</span>
                    <button onclick="updateItemQuantity('${item.id}', ${item.quantity + 1})" 
                            class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg font-bold transition">+</button>
                    
                    <button onclick="removeFromCart('${item.id}')" 
                            class="ml-auto text-red-600 hover:text-red-700 font-semibold text-sm md:text-base">Remove</button>
                </div>
            </div>
            
            <div class="text-right flex-shrink-0">
                <p class="text-xs md:text-sm text-gray-500">Subtotal</p>
                <p class="text-lg md:text-xl font-black text-gray-900">₹${item.price * item.quantity}</p>
            </div>
        </div>
    `).join('');
    
    updateOrderSummary();
}

function updateItemQuantity(itemId, quantity) {
    cart.updateQuantity(itemId, quantity);
}

function removeFromCart(itemId) {
    if (confirm('Remove this item from cart?')) {
        cart.removeItem(itemId);
    }
}

function updateOrderSummary() {
    const subtotal = cart.getSubtotal();
    const total = subtotal + deliveryCharge;
    expectedAmount = total;
    
    document.getElementById('subtotalAmount').textContent = `₹${subtotal}`;
    document.getElementById('totalAmount').textContent = `₹${total}`;
    
    updatePaymentDetails(total);
}

// Update payment details with UPI link and QR
function updatePaymentDetails(total) {
    const paymentAmountEl = document.getElementById('paymentAmount');
    if (paymentAmountEl) {
        paymentAmountEl.textContent = `₹${total}`;
    }
    
    const upiPayAmountEl = document.getElementById('upiPayAmount');
    if (upiPayAmountEl) {
        upiPayAmountEl.textContent = total;
    }
    
    const qrAmountEl = document.getElementById('qrAmount');
    if (qrAmountEl) {
        qrAmountEl.textContent = total;
    }
    
    generateUPILink(total);
}

// Generate UPI payment link and QR
function generateUPILink(amount) {
    const upiId = '9972199259@okbizaxis';
    const merchantName = 'Shreevari Snacks';
    const transactionNote = `Order-${Date.now()}`;
    
    // UPI Intent URL
    const upiURL = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    // Update UPI button
    const upiLinkBtn = document.getElementById('upiPayBtn');
    if (upiLinkBtn) {
        upiLinkBtn.onclick = () => {
            window.location.href = upiURL;
        };
    }
    
    // Generate QR code
    const qrURL = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(upiURL)}&choe=UTF-8`;
    
    const qrImg = document.getElementById('paymentQR');
    if (qrImg) {
        qrImg.src = qrURL;
    }
    
    const upiIdEl = document.getElementById('upiId');
    if (upiIdEl) {
        upiIdEl.textContent = upiId;
    }
}

// Auto-reload
window.addEventListener('cartUpdated', () => {
    displayCartItems();
});

// Get location
document.getElementById('getLocationBtn').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocation not supported');
        return;
    }
    
    const btn = document.getElementById('getLocationBtn');
    btn.textContent = 'Getting location...';
    btn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            customerLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            const distance = calculateDistance(
                RESTAURANT_LOCATION.lat,
                RESTAURANT_LOCATION.lng,
                customerLocation.lat,
                customerLocation.lng
            );
            
            displayDistanceInfo(distance);
            btn.textContent = '✓ Location Set';
            btn.disabled = false;
        },
        (error) => {
            alert('Unable to get location');
            btn.textContent = '📍 Use Current Location';
            btn.disabled = false;
        }
    );
});

function displayDistanceInfo(distance) {
    const distanceInfo = document.getElementById('distanceInfo');
    const outOfRange = document.getElementById('outOfRangeWarning');
    
    if (distance > 10) {
        outOfRange.classList.remove('hidden');
        distanceInfo.classList.add('hidden');
        deliveryCharge = 0;
        return;
    }
    
    outOfRange.classList.add('hidden');
    distanceInfo.classList.remove('hidden');
    
    deliveryCharge = cart.calculateDeliveryCharge(distance);
    
    document.getElementById('distanceText').textContent = `${distance.toFixed(2)}km`;
    document.getElementById('deliveryChargeText').textContent = `₹${deliveryCharge}`;
    document.getElementById('deliveryAmount').textContent = `₹${deliveryCharge}`;
    
    updateOrderSummary();
}

// Payment method toggle
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const upiSection = document.getElementById('upiSection');
        const qrSection = document.getElementById('qrSection');
        
        if (e.target.value === 'upi') {
            upiSection.classList.remove('hidden');
            qrSection.classList.add('hidden');
        } else {
            upiSection.classList.add('hidden');
            qrSection.classList.remove('hidden');
        }
    });
});

// Payment screenshot upload
document.getElementById('paymentScreenshot')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        e.target.value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        e.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        paymentScreenshot = event.target.result;
        
        const preview = document.getElementById('screenshotPreview');
        if (preview) {
            preview.src = paymentScreenshot;
            preview.classList.remove('hidden');
        }
        
        const uploaded = document.getElementById('screenshotUploaded');
        if (uploaded) {
            uploaded.classList.remove('hidden');
        }
    };
    reader.readAsDataURL(file);
});

// Place order - SECURE VERSION
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check login
    if (!currentUser) {
        alert('⚠️ Please login to place an order');
        window.location.href = 'login.html';
        return;
    }
    
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('customerAddress').value;
    const transactionId = document.getElementById('transactionId').value.trim();
    
    // Validations
    if (!customerLocation) {
        alert('⚠️ Please set your location first');
        return;
    }
    
    const distance = calculateDistance(
        RESTAURANT_LOCATION.lat,
        RESTAURANT_LOCATION.lng,
        customerLocation.lat,
        customerLocation.lng
    );
    
    if (distance > 10) {
        alert('Sorry! We only deliver within 10km');
        return;
    }
    
    if (!transactionId || transactionId.length < 10) {
        alert('⚠️ Please enter valid Transaction ID (minimum 10 digits)');
        return;
    }
    
    if (!paymentScreenshot) {
        alert('⚠️ Please upload payment screenshot');
        return;
    }
    
    // Create order data
    const orderData = {
        userId: currentUser.uid,
        customerName: name,
        customerEmail: currentUser.email,
        phone: phone,
        address: address,
        distance: distance.toFixed(2),
        orderItems: cart.items,
        subtotal: cart.getSubtotal(),
        deliveryCharge: deliveryCharge,
        totalAmount: expectedAmount,
        transactionId: transactionId,
        paymentScreenshot: paymentScreenshot,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'upi',
        status: 'pending_verification',
        paymentVerified: false,
        createdAt: new Date().toISOString(),
        orderNumber: `ORD${Date.now()}`
    };
    
    try {
        // Save to Firebase - ADMIN WILL SEE IN DASHBOARD
        await db.collection('orders').add(orderData);
        
        // Show success message - NO WHATSAPP!
        alert(`✅ Order Submitted Successfully!\n\nOrder Number: ${orderData.orderNumber}\n\n⏳ Your order is pending payment verification.\n\nWe will verify your payment and confirm delivery time within 10 minutes.\n\nYou can check order status in your Profile page.\n\nThank you!`);
        
        // Clear cart
        cart.clearCart();
        displayCartItems();
        document.getElementById('checkoutForm').reset();
        paymentScreenshot = null;
        customerLocation = null;
        deliveryCharge = 0;
        
        if (document.getElementById('screenshotPreview')) {
            document.getElementById('screenshotPreview').classList.add('hidden');
        }
        if (document.getElementById('screenshotUploaded')) {
            document.getElementById('screenshotUploaded').classList.add('hidden');
        }
        
        // Redirect to profile to see order
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error placing order:', error);
        alert('❌ Error placing order. Please try again.');
    }
});

// Initialize
displayCartItems();

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) displayCartItems();
});

window.addEventListener('focus', () => {
    displayCartItems();
});
