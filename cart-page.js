// ========================================
// CART PAGE - QR CODE PAYMENT ONLY
// ========================================

// Restaurant location
const RESTAURANT_LOCATION = {
    lat: 13.520935985883005,
    lng: 77.237526720881
};

let customerLocation = null;
let deliveryCharge = 0;
let paymentScreenshot = null;
let expectedAmount = 0;
let currentUser = null;

console.log('📄 Cart page script loaded');

// Wait for Firebase to be ready
function waitForFirebase(callback, attempts = 0) {
    if (attempts > 10) {
        console.error('❌ Firebase not loaded after 10 attempts');
        alert('Error: System not loading. Please refresh page.');
        return;
    }
    
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        console.log('✅ Firebase ready');
        callback();
    } else {
        console.log('⏳ Waiting for Firebase... attempt', attempts + 1);
        setTimeout(() => waitForFirebase(callback, attempts + 1), 500);
    }
}

// Initialize when Firebase is ready
waitForFirebase(() => {
    console.log('🚀 Initializing cart page');
    
    // Check authentication
    auth.onAuthStateChanged((user) => {
        if (!user) {
            console.log('⚠️ Not logged in');
            alert('⚠️ Please login to place an order');
            window.location.href = 'login.html?redirect=cart.html';
            return;
        }
        console.log('✅ User logged in:', user.email);
        currentUser = user;
    });
    
    // Load cart display
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', displayCartItems);
    } else {
        displayCartItems();
    }
});

// ========================================
// DISPLAY CART ITEMS
// ========================================

function displayCartItems() {
    console.log('📋 Displaying cart items');
    
    // Wait for cart object
    if (typeof cart === 'undefined') {
        console.warn('⏳ Cart not ready, retrying...');
        setTimeout(displayCartItems, 500);
        return;
    }
    
    console.log('Items in cart:', cart.items.length);
    
    const container = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const checkoutSection = document.getElementById('checkoutSection');
    
    if (!container) {
        console.error('❌ cartItems element not found!');
        return;
    }
    
    // Empty cart
    if (!cart.items || cart.items.length === 0) {
        console.log('🛒 Cart is empty');
        container.classList.add('hidden');
        if (emptyCart) emptyCart.classList.remove('hidden');
        if (checkoutSection) checkoutSection.classList.add('hidden');
        return;
    }
    
    // Show items
    container.classList.remove('hidden');
    if (emptyCart) emptyCart.classList.add('hidden');
    if (checkoutSection) checkoutSection.classList.remove('hidden');
    
    let html = '';
    
    cart.items.forEach((item, i) => {
        const subtotal = item.price * item.quantity;
        
        html += `
            <div class="bg-white rounded-xl shadow-lg p-4 flex gap-4 mb-4">
                ${item.image ? 
                    `<img src="${item.image}" alt="${item.name}" class="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0">` : 
                    `<div class="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">🍕</div>`
                }
                
                <div class="flex-1">
                    <h3 class="font-bold text-gray-900">${item.name}</h3>
                    <p class="text-orange-600 font-bold text-lg">₹${item.price}</p>
                    
                    <div class="flex items-center gap-2 mt-2">
                        <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})" class="bg-gray-200 w-8 h-8 rounded font-bold">−</button>
                        <span class="font-bold w-8 text-center">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})" class="bg-gray-200 w-8 h-8 rounded font-bold">+</button>
                        <button onclick="removeItem('${item.id}')" class="ml-auto text-red-600 font-bold text-sm">Remove</button>
                    </div>
                </div>
                
                <div class="text-right">
                    <p class="text-xs text-gray-500">Subtotal</p>
                    <p class="font-black text-lg">₹${subtotal}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    updateSummary();
}

function updateQuantity(itemId, qty) {
    if (qty <= 0) {
        if (confirm('Remove this item?')) removeItem(itemId);
        return;
    }
    cart.updateQuantity(itemId, qty);
    displayCartItems();
}

function removeItem(itemId) {
    cart.removeItem(itemId);
    displayCartItems();
}

// ========================================
// UPDATE ORDER SUMMARY
// ========================================

function updateSummary() {
    const subtotal = cart.getSubtotal();
    const total = subtotal + deliveryCharge;
    expectedAmount = total;
    
    document.getElementById('subtotalAmount').textContent = `₹${subtotal}`;
    document.getElementById('totalAmount').textContent = `₹${total}`;
    document.getElementById('deliveryAmount').textContent = `₹${deliveryCharge}`;
    document.getElementById('paymentAmount').textContent = `₹${total}`;
    document.getElementById('qrAmount').textContent = total;
    
    // Generate QR with amount
    const upiId = '9972199259@okbizaxis';
    const upiURL = `upi://pay?pa=${upiId}&pn=Shreevari%20Snacks&am=${total}&cu=INR`;
    const qrURL = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(upiURL)}&choe=UTF-8`;
    
    const qrImg = document.getElementById('paymentQR');
    if (qrImg) qrImg.src = qrURL;
}

// ========================================
// LOCATION
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
            (pos) => {
                customerLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                
                const distance = calculateDistance(
                    RESTAURANT_LOCATION.lat,
                    RESTAURANT_LOCATION.lng,
                    customerLocation.lat,
                    customerLocation.lng
                );
                
                console.log('Distance:', distance + 'km');
                
                const distInfo = document.getElementById('distanceInfo');
                const outOfRange = document.getElementById('outOfRangeWarning');
                
                if (distance > 10) {
                    if (outOfRange) outOfRange.classList.remove('hidden');
                    if (distInfo) distInfo.classList.add('hidden');
                    deliveryCharge = 0;
                } else {
                    if (outOfRange) outOfRange.classList.add('hidden');
                    if (distInfo) distInfo.classList.remove('hidden');
                    
                    deliveryCharge = cart.calculateDeliveryCharge(distance);
                    
                    const distText = document.getElementById('distanceText');
                    const delivChargeText = document.getElementById('deliveryChargeText');
                    
                    if (distText) distText.textContent = `${distance.toFixed(2)}km`;
                    if (delivChargeText) delivChargeText.textContent = `₹${deliveryCharge}`;
                }
                
                updateSummary();
                btn.textContent = '✓ Location Set';
                btn.disabled = false;
            },
            (error) => {
                console.error('Location error:', error);
                alert('Unable to get location');
                btn.textContent = '📍 Use Current Location';
                btn.disabled = false;
            }
        );
    });
}

// ========================================
// SCREENSHOT UPLOAD
// ========================================

if (document.getElementById('paymentScreenshot')) {
    document.getElementById('paymentScreenshot').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please upload image');
            e.target.value = '';
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Image too large (max 5MB)');
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
        
        if (!currentUser) {
            alert('⚠️ Please login');
            window.location.href = 'login.html?redirect=cart.html';
            return;
        }
        
        const name = document.getElementById('customerName').value;
        const phone = document.getElementById('customerPhone').value;
        const address = document.getElementById('customerAddress').value;
        const transactionId = document.getElementById('transactionId').value.trim();
        
        if (!customerLocation) {
            alert('⚠️ Please set location');
            return;
        }
        
        const distance = calculateDistance(
            RESTAURANT_LOCATION.lat,
            RESTAURANT_LOCATION.lng,
            customerLocation.lat,
            customerLocation.lng
        );
        
        if (distance > 10) {
            alert('Out of delivery range (10km)');
            return;
        }
        
        if (!transactionId || transactionId.length < 10) {
            alert('⚠️ Enter valid Transaction ID (10+ digits)');
            return;
        }
        
        if (!paymentScreenshot) {
            alert('⚠️ Upload payment screenshot');
            return;
        }
        
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
            paymentMethod: 'qr',
            status: 'pending_verification',
            paymentVerified: false,
            createdAt: new Date().toISOString(),
            orderNumber: `ORD${Date.now()}`
        };
        
        try {
            // Wait for DB to be ready
            if (typeof db === 'undefined') {
                alert('System not ready. Please refresh.');
                return;
            }
            
            await db.collection('orders').add(orderData);
            
            console.log('✅ Order saved!');
            
            alert(`✅ Order Submitted!\n\nOrder #${orderData.orderNumber}\n\n⏳ Verification in progress...`);
            
            cart.clearCart();
            displayCartItems();
            document.getElementById('checkoutForm').reset();
            paymentScreenshot = null;
            customerLocation = null;
            deliveryCharge = 0;
            
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Error:', error);
            alert('❌ Error: ' + error.message);
        }
    });
}

console.log('✅ Cart page ready');
