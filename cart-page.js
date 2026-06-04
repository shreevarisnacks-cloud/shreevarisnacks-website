// ========================================
// CART PAGE - DISPLAY ITEMS PROPERLY
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

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================

console.log('📄 Cart page loading...');

// Check if user is logged in
auth.onAuthStateChanged((user) => {
    if (!user) {
        console.log('⚠️ User not logged in, redirecting to login...');
        alert('⚠️ Please login to place an order');
        window.location.href = 'login.html?redirect=cart.html';
        return;
    }
    console.log('✅ User logged in:', user.email);
    currentUser = user;
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛒 Initializing cart page...');
    displayCartItems();
    updateCartBadges();
});

// ========================================
// DISPLAY CART ITEMS
// ========================================

function displayCartItems() {
    console.log('📋 displayCartItems() called');
    console.log('Cart items:', cart.items);
    
    const container = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const checkoutSection = document.getElementById('checkoutSection');
    
    // Check if elements exist
    if (!container) {
        console.error('❌ cartItems element not found!');
        return;
    }
    
    // If cart is empty
    if (!cart.items || cart.items.length === 0) {
        console.log('🛒 Cart is empty');
        container.classList.add('hidden');
        if (emptyCart) emptyCart.classList.remove('hidden');
        if (checkoutSection) checkoutSection.classList.add('hidden');
        return;
    }
    
    // Show cart items
    console.log('📦 Displaying ' + cart.items.length + ' items');
    container.classList.remove('hidden');
    if (emptyCart) emptyCart.classList.add('hidden');
    if (checkoutSection) checkoutSection.classList.remove('hidden');
    
    let itemsHTML = '';
    
    cart.items.forEach((item, index) => {
        console.log('  Item ' + (index + 1) + ':', item.name, 'x' + item.quantity);
        
        const subtotal = item.price * item.quantity;
        
        itemsHTML += `
            <div class="bg-white rounded-xl shadow-lg p-4 flex gap-4 mb-4">
                <!-- Image -->
                ${item.image ? 
                    `<img src="${item.image}" alt="${item.name}" class="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0">` : 
                    `<div class="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-3xl md:text-4xl flex-shrink-0">🍕</div>`
                }
                
                <!-- Details -->
                <div class="flex-1 min-w-0">
                    <h3 class="text-base md:text-lg font-bold text-gray-900 truncate">${item.name}</h3>
                    <p class="text-orange-600 font-bold text-lg md:text-xl">₹${item.price}</p>
                    
                    <!-- Quantity Controls -->
                    <div class="flex items-center gap-2 md:gap-3 mt-2 md:mt-3">
                        <button onclick="updateItemQuantity('${item.id}', ${item.quantity - 1})" 
                                class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg font-bold transition">
                            −
                        </button>
                        <span class="font-bold text-base md:text-lg w-8 text-center">${item.quantity}</span>
                        <button onclick="updateItemQuantity('${item.id}', ${item.quantity + 1})" 
                                class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg font-bold transition">
                            +
                        </button>
                        
                        <button onclick="removeFromCart('${item.id}')" 
                                class="ml-auto text-red-600 hover:text-red-700 font-semibold text-sm md:text-base">
                            🗑️ Remove
                        </button>
                    </div>
                </div>
                
                <!-- Subtotal -->
                <div class="text-right flex-shrink-0">
                    <p class="text-xs md:text-sm text-gray-500">Subtotal</p>
                    <p class="text-lg md:text-xl font-black text-gray-900">₹${subtotal}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = itemsHTML;
    console.log('✅ Items displayed');
    
    // Update summary
    updateOrderSummary();
}

// ========================================
// UPDATE QUANTITY
// ========================================

function updateItemQuantity(itemId, quantity) {
    console.log('📝 Updating quantity for', itemId, 'to', quantity);
    
    if (quantity <= 0) {
        if (confirm('Remove this item?')) {
            removeFromCart(itemId);
        }
        return;
    }
    
    cart.updateQuantity(itemId, quantity);
    displayCartItems();
}

// ========================================
// REMOVE ITEM
// ========================================

function removeFromCart(itemId) {
    console.log('🗑️ Removing item:', itemId);
    
    cart.removeItem(itemId);
    displayCartItems();
    updateCartBadges();
}

// ========================================
// UPDATE ORDER SUMMARY
// ========================================

function updateOrderSummary() {
    console.log('📊 Updating order summary...');
    
    const subtotal = cart.getSubtotal();
    const total = subtotal + deliveryCharge;
    expectedAmount = total;
    
    console.log('  Subtotal:', subtotal);
    console.log('  Delivery:', deliveryCharge);
    console.log('  Total:', total);
    
    // Update summary display
    const subtotalEl = document.getElementById('subtotalAmount');
    const totalEl = document.getElementById('totalAmount');
    const deliveryEl = document.getElementById('deliveryAmount');
    
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (totalEl) totalEl.textContent = `₹${total}`;
    if (deliveryEl) deliveryEl.textContent = `₹${deliveryCharge}`;
    
    // Update payment display
    updatePaymentAmount(total);
}

// ========================================
// UPDATE PAYMENT AMOUNT
// ========================================

function updatePaymentAmount(total) {
    const paymentAmountEl = document.getElementById('paymentAmount');
    const upiPayAmountEl = document.getElementById('upiPayAmount');
    const qrAmountEl = document.getElementById('qrAmount');
    
    if (paymentAmountEl) paymentAmountEl.textContent = `₹${total}`;
    if (upiPayAmountEl) upiPayAmountEl.textContent = total;
    if (qrAmountEl) qrAmountEl.textContent = total;
    
    generateUPILink(total);
}

// ========================================
// GENERATE UPI LINK AND QR
// ========================================

function generateUPILink(amount) {
    const upiId = '9972199259@okbizaxis';
    const merchantName = 'Shreevari Snacks';
    const transactionNote = `Order-${Date.now()}`;
    
    // UPI Intent URL
    const upiURL = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    // Update UPI button
    const upiPayBtn = document.getElementById('upiPayBtn');
    if (upiPayBtn) {
        upiPayBtn.onclick = () => {
            console.log('🔗 Opening UPI link with amount:', amount);
            window.location.href = upiURL;
        };
    }
    
    // Generate QR code
    const qrURL = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(upiURL)}&choe=UTF-8`;
    
    const qrImg = document.getElementById('paymentQR');
    if (qrImg) qrImg.src = qrURL;
    
    const upiIdEl = document.getElementById('upiId');
    if (upiIdEl) upiIdEl.textContent = upiId;
}

// ========================================
// UPDATE CART BADGES
// ========================================

function updateCartBadges() {
    const count = cart.getItemCount();
    console.log('🔔 Updating cart badge to:', count);
    
    const badge = document.getElementById('cartBadge');
    const badgeMobile = document.getElementById('cartBadgeMobile');
    
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    if (badgeMobile) {
        if (count > 0) {
            badgeMobile.textContent = count;
            badgeMobile.classList.remove('hidden');
        } else {
            badgeMobile.classList.add('hidden');
        }
    }
}

// ========================================
// GET LOCATION
// ========================================

if (document.getElementById('getLocationBtn')) {
    document.getElementById('getLocationBtn').addEventListener('click', () => {
        console.log('📍 Getting location...');
        
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
                
                console.log('✅ Got location:', customerLocation);
                
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
                console.error('❌ Error getting location:', error);
                alert('Unable to get location');
                btn.textContent = '📍 Use Current Location';
                btn.disabled = false;
            }
        );
    });
}

// ========================================
// DISPLAY DISTANCE INFO
// ========================================

function displayDistanceInfo(distance) {
    console.log('📏 Distance:', distance + 'km');
    
    const distanceInfo = document.getElementById('distanceInfo');
    const outOfRange = document.getElementById('outOfRangeWarning');
    
    if (distance > 10) {
        console.warn('⚠️ Out of delivery range');
        if (outOfRange) outOfRange.classList.remove('hidden');
        if (distanceInfo) distanceInfo.classList.add('hidden');
        deliveryCharge = 0;
        return;
    }
    
    if (outOfRange) outOfRange.classList.add('hidden');
    if (distanceInfo) distanceInfo.classList.remove('hidden');
    
    deliveryCharge = cart.calculateDeliveryCharge(distance);
    console.log('💰 Delivery charge:', deliveryCharge);
    
    const distanceText = document.getElementById('distanceText');
    const deliveryChargeText = document.getElementById('deliveryChargeText');
    
    if (distanceText) distanceText.textContent = `${distance.toFixed(2)}km`;
    if (deliveryChargeText) deliveryChargeText.textContent = `₹${deliveryCharge}`;
    
    updateOrderSummary();
}

// ========================================
// PAYMENT METHOD TOGGLE
// ========================================

document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const upiSection = document.getElementById('upiSection');
        const qrSection = document.getElementById('qrSection');
        
        if (!upiSection || !qrSection) return;
        
        if (e.target.value === 'upi') {
            upiSection.classList.remove('hidden');
            qrSection.classList.add('hidden');
        } else {
            upiSection.classList.add('hidden');
            qrSection.classList.remove('hidden');
        }
    });
});

// ========================================
// SCREENSHOT UPLOAD
// ========================================

if (document.getElementById('paymentScreenshot')) {
    document.getElementById('paymentScreenshot').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log('📷 Screenshot uploaded:', file.name);
        
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
            if (uploaded) uploaded.classList.remove('hidden');
            
            console.log('✅ Screenshot ready');
        };
        reader.readAsDataURL(file);
    });
}

// ========================================
// PLACE ORDER
// ========================================

if (document.getElementById('checkoutForm')) {
    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('📤 Placing order...');
        
        // Check login
        if (!currentUser) {
            alert('⚠️ Please login to place an order');
            window.location.href = 'login.html?redirect=cart.html';
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
        
        // Create order
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
        
        console.log('📦 Order data:', orderData);
        
        try {
            // Save to Firebase
            await db.collection('orders').add(orderData);
            
            console.log('✅ Order saved to Firebase!');
            
            alert(`✅ Order Submitted!\n\nOrder #${orderData.orderNumber}\n\n⏳ Payment verification in progress...\n\nYou can track in your Profile.`);
            
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
            
            // Redirect to profile
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Error placing order:', error);
            alert('❌ Error placing order. Please try again.');
        }
    });
}

// ========================================
// AUTO-RELOAD ON PAGE VISIBILITY
// ========================================

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('📄 Page became visible, refreshing...');
        displayCartItems();
    }
});

window.addEventListener('focus', () => {
    console.log('📄 Window focused, refreshing...');
    displayCartItems();
});

// ========================================
// CART UPDATE LISTENER
// ========================================

window.addEventListener('cartUpdated', () => {
    console.log('🔄 Cart updated event received');
    displayCartItems();
});

console.log('✅ Cart page fully loaded');
