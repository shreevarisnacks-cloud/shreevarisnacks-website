// ========================================
// CART PAGE FUNCTIONALITY
// ========================================

// Restaurant location (Koratagere, Karnataka)
const RESTAURANT_LOCATION = {
    lat: 13.5290,
    lng: 76.9930
};

let customerLocation = null;
let deliveryCharge = 0;

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
            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg">` : 
              `<div class="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-4xl">🍕</div>`}
            
            <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900">${item.name}</h3>
                <p class="text-orange-600 font-bold text-xl">₹${item.price}</p>
                
                <div class="flex items-center gap-3 mt-3">
                    <button onclick="updateItemQuantity('${item.id}', ${item.quantity - 1})" 
                            class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg font-bold transition">-</button>
                    <span class="font-bold text-lg w-8 text-center">${item.quantity}</span>
                    <button onclick="updateItemQuantity('${item.id}', ${item.quantity + 1})" 
                            class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg font-bold transition">+</button>
                    
                    <button onclick="removeFromCart('${item.id}')" 
                            class="ml-auto text-red-600 hover:text-red-700 font-semibold">Remove</button>
                </div>
            </div>
            
            <div class="text-right">
                <p class="text-sm text-gray-500">Subtotal</p>
                <p class="text-xl font-black text-gray-900">₹${item.price * item.quantity}</p>
            </div>
        </div>
    `).join('');
    
    updateOrderSummary();
}

function updateItemQuantity(itemId, quantity) {
    cart.updateQuantity(itemId, quantity);
    displayCartItems();
}

function removeFromCart(itemId) {
    if (confirm('Remove this item from cart?')) {
        cart.removeItem(itemId);
        displayCartItems();
    }
}

function updateOrderSummary() {
    const subtotal = cart.getSubtotal();
    document.getElementById('subtotalAmount').textContent = `₹${subtotal}`;
    document.getElementById('totalAmount').textContent = `₹${subtotal + deliveryCharge}`;
}

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
            alert('Unable to get your location. Please enter address manually and we will calculate distance.');
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

// Place order
document.getElementById('checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('customerAddress').value;
    
    if (!customerLocation) {
        alert('Please click "Use Current Location" button to calculate delivery charges');
        return;
    }
    
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
    
    const customerInfo = {
        name,
        phone,
        address,
        distance: distance.toFixed(2)
    };
    
    const whatsappMessage = cart.generateWhatsAppMessage(customerInfo, deliveryCharge);
    const whatsappURL = `https://wa.me/919844572129?text=${whatsappMessage}`;
    
    // Open WhatsApp
    window.open(whatsappURL, '_blank');
    
    // Optional: Clear cart after order
    setTimeout(() => {
        if (confirm('Order sent to WhatsApp! Would you like to clear your cart?')) {
            cart.clearCart();
            displayCartItems();
            document.getElementById('checkoutForm').reset();
            customerLocation = null;
            deliveryCharge = 0;
            document.getElementById('distanceInfo').classList.add('hidden');
            document.getElementById('getLocationBtn').textContent = '📍 Use Current Location';
        }
    }, 1000);
});

// Initialize page
displayCartItems();
