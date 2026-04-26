// ========================================
// CART PAGE FUNCTIONALITY
// WITH PAYMENT VALIDATION
// ========================================

// Restaurant location (Koratagere, Karnataka)
const RESTAURANT_LOCATION = {
    lat: 13.5290,
    lng: 76.9930
};

let customerLocation = null;
let deliveryCharge = 0;
let paymentCompleted = false;

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
                            class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg font-bold transition touch-manipulation">-</button>
                    <span class="font-bold text-base md:text-lg w-8 text-center">${item.quantity}</span>
                    <button onclick="updateItemQuantity('${item.id}', ${item.quantity + 1})" 
                            class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg font-bold transition touch-manipulation">+</button>
                    
                    <button onclick="removeFromCart('${item.id}')" 
                            class="ml-auto text-red-600 hover:text-red-700 font-semibold text-sm md:text-base touch-manipulation">Remove</button>
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
    
    document.getElementById('subtotalAmount').textContent = `₹${subtotal}`;
    document.getElementById('totalAmount').textContent = `₹${total}`;
    
    // Update payment amount display
    updatePaymentAmount(total);
}

// Update payment amount in payment section
function updatePaymentAmount(total) {
    const paymentAmountEl = document.getElementById('paymentAmount');
    if (paymentAmountEl) {
        paymentAmountEl.textContent = `₹${total}`;
    }
}

// AUTO-RELOAD: Listen for cart updates
window.addEventListener('cartUpdated', () => {
    console.log('Cart updated - reloading display');
    displayCartItems();
});

// Get current location
document.getElementById('getLocationBtn').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
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
            alert('Unable to get your location. Please enter address manually.');
            btn.textContent = '📍 Use Current Location';
            btn.disabled = false;
        }
    );
});

function displayDistanceInfo(distance) {
    const distanceInfo = document.getElementById('distanceInfo');
    const outOfRange = document.getElementById('outOfRangeWarning');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    if (distance > 10) {
        outOfRange.classList.remove('hidden');
        distanceInfo.classList.add('hidden');
        placeOrderBtn.disabled = true;
        placeOrderBtn.classList.add('opacity-50', 'cursor-not-allowed');
        deliveryCharge = 0;
        return;
    }
    
    outOfRange.classList.add('hidden');
    distanceInfo.classList.remove('hidden');
    placeOrderBtn.disabled = false;
    placeOrderBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    
    deliveryCharge = cart.calculateDeliveryCharge(distance);
    
    document.getElementById('distanceText').textContent = `${distance.toFixed(2)}km`;
    document.getElementById('deliveryChargeText').textContent = `₹${deliveryCharge}`;
    document.getElementById('deliveryAmount').textContent = `₹${deliveryCharge}`;
    
    updateOrderSummary();
}

// Payment confirmation
document.getElementById('confirmPaymentBtn')?.addEventListener('click', () => {
    const transactionId = document.getElementById('transactionId').value.trim();
    
    if (!transactionId || transactionId.length < 6) {
        alert('Please enter a valid Transaction ID (minimum 6 characters)');
        return;
    }
    
    paymentCompleted = true;
    
    // Show success message
    document.getElementById('paymentSection').classList.add('hidden');
    document.getElementById('paymentConfirmed').classList.remove('hidden');
    
    // Enable place order button
    document.getElementById('placeOrderBtn').disabled = false;
    document.getElementById('placeOrderBtn').classList.remove('opacity-50', 'cursor-not-allowed');
    
    alert('✓ Payment confirmed! You can now place your order.');
});

// Place order
document.getElementById('checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('customerAddress').value;
    
    // Validate location
    if (!customerLocation) {
        alert('Please click "Use Current Location" button to calculate delivery charges');
        return;
    }
    
    // Check distance
    const distance = calculateDistance(
        RESTAURANT_LOCATION.lat,
        RESTAURANT_LOCATION.lng,
        customerLocation.lat,
        customerLocation.lng
    );
    
    if (distance > 10) {
        alert('Sorry! We only deliver within 10km radius from our restaurant.');
        return;
    }
    
    // PAYMENT VALIDATION - CRITICAL!
    if (!paymentCompleted) {
        alert('⚠️ Please complete payment first!\n\n1. Pay via UPI/QR Code\n2. Enter Transaction ID\n3. Click "Confirm Payment"\n4. Then place order');
        
        // Scroll to payment section
        document.getElementById('paymentSection').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    // Get transaction ID
    const transactionId = document.getElementById('transactionId').value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    const customerInfo = {
        name,
        phone,
        address,
        distance: distance.toFixed(2),
        transactionId,
        paymentMethod
    };
    
    const whatsappMessage = cart.generateWhatsAppMessage(customerInfo, deliveryCharge);
    const whatsappURL = `https://wa.me/919844572129?text=${whatsappMessage}`;
    
    // Open WhatsApp
    window.open(whatsappURL, '_blank');
    
    // Show success message
    alert('✓ Order sent to WhatsApp!\n\nPlease send the message to complete your order.\n\nWe will confirm delivery time shortly.');
    
    // Optional: Clear cart after order
    setTimeout(() => {
        if (confirm('Order placed successfully! Would you like to clear your cart?')) {
            cart.clearCart();
            displayCartItems();
            document.getElementById('checkoutForm').reset();
            customerLocation = null;
            deliveryCharge = 0;
            paymentCompleted = false;
            document.getElementById('distanceInfo').classList.add('hidden');
            document.getElementById('paymentSection').classList.remove('hidden');
            document.getElementById('paymentConfirmed').classList.add('hidden');
            document.getElementById('getLocationBtn').textContent = '📍 Use Current Location';
        }
    }, 1000);
});

// Initialize page
displayCartItems();

// Reload cart when page becomes visible (handles mobile back button)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        displayCartItems();
    }
});

// Reload cart when page gains focus (handles tab switching)
window.addEventListener('focus', () => {
    displayCartItems();
});
