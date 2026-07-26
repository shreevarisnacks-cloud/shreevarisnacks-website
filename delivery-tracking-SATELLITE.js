// ========================================
// DELIVERY TRACKING WITH SATELLITE VIEW
// LEAFLET + OPENSTREETMAP + ESRI SATELLITE
// 100% FREE!
// ========================================

console.log('🚗 Loading delivery tracking with satellite view...');

let trackingMap = null;
let customerMarker = null;
let restaurantMarker = null;
let deliveryBoyMarker = null;
let routePath = null;
let currentMapLayer = 'street';

// ========================================
// INITIALIZE TRACKING
// ========================================

async function initializeTracking() {
    console.log('🚗 Initializing delivery tracking...');
    
    const orderId = getOrderIdFromURL();
    if (!orderId) {
        console.error('❌ No order ID in URL');
        alert('No order ID found. Please go back to your profile.');
        return;
    }
    
    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        const order = orderDoc.data();
        
        if (!order) {
            alert('Order not found');
            return;
        }
        
        initializeMap(order);
        displayOrderDetails(order);
        listenToOrderUpdates(orderId);
        
        console.log('✅ Tracking initialized');
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error loading tracking: ' + error.message);
    }
}

// ========================================
// INITIALIZE MAP WITH SATELLITE
// ========================================

function initializeMap(order) {
    console.log('🗺️ Initializing map with satellite view...');
    
    const restaurantLocation = {
        lat: 13.520935985883005,
        lng: 77.237526720881
    };
    
    const customerLocation = {
        lat: order.latitude || restaurantLocation.lat,
        lng: order.longitude || restaurantLocation.lng
    };
    
    // Initialize map
    trackingMap = L.map('trackingMapContainer').setView([restaurantLocation.lat, restaurantLocation.lng], 14);
    
    // Street layer
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    });
    
    // Satellite layer (ESRI)
    const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
            attribution: 'Tiles © Esri',
            maxZoom: 18
        }
    );
    
    // Add street by default
    streetLayer.addTo(trackingMap);
    
    // Store for toggling
    trackingMap.streetLayer = streetLayer;
    trackingMap.satelliteLayer = satelliteLayer;
    
    // Add toggle button
    addTrackingMapToggleButton();
    
    // Restaurant marker
    restaurantMarker = L.circleMarker([restaurantLocation.lat, restaurantLocation.lng], {
        radius: 12,
        fillColor: '#ef4444',
        color: '#991b1b',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8
    })
    .bindPopup('🍽️ Shreevari Snacks')
    .addTo(trackingMap);
    
    // Customer marker
    customerMarker = L.circleMarker([customerLocation.lat, customerLocation.lng], {
        radius: 10,
        fillColor: '#3b82f6',
        color: '#1e40af',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8
    })
    .bindPopup('📍 Your Location')
    .addTo(trackingMap);
    
    // Delivery boy marker
    const deliveryBoyLat = order.deliveryBoyLat || restaurantLocation.lat;
    const deliveryBoyLng = order.deliveryBoyLng || restaurantLocation.lng;
    
    deliveryBoyMarker = L.circleMarker([deliveryBoyLat, deliveryBoyLng], {
        radius: 11,
        fillColor: '#eab308',
        color: '#a16207',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8
    })
    .bindPopup('🚗 Delivery Boy')
    .addTo(trackingMap);
    
    // Draw route
    drawRoute([restaurantLocation.lat, restaurantLocation.lng], [customerLocation.lat, customerLocation.lng]);
    
    console.log('✅ Map initialized with satellite view');
}

// ========================================
// TOGGLE MAP VIEW
// ========================================

function toggleTrackingMapLayer() {
    console.log('🗺️ Toggling map view...');
    
    if (currentMapLayer === 'street') {
        trackingMap.removeLayer(trackingMap.streetLayer);
        trackingMap.addLayer(trackingMap.satelliteLayer);
        currentMapLayer = 'satellite';
        
        document.getElementById('trackingMapToggleBtn').innerHTML = '🗺️ Street View';
        
        console.log('✅ Switched to satellite');
    } else {
        trackingMap.removeLayer(trackingMap.satelliteLayer);
        trackingMap.addLayer(trackingMap.streetLayer);
        currentMapLayer = 'street';
        
        document.getElementById('trackingMapToggleBtn').innerHTML = '🛰️ Satellite View';
        
        console.log('✅ Switched to street');
    }
}

// ========================================
// ADD TOGGLE BUTTON FOR TRACKING
// ========================================

function addTrackingMapToggleButton() {
    const buttonDiv = document.createElement('div');
    buttonDiv.style.position = 'absolute';
    buttonDiv.style.top = '10px';
    buttonDiv.style.right = '10px';
    buttonDiv.style.zIndex = '1000';
    
    const button = document.createElement('button');
    button.id = 'trackingMapToggleBtn';
    button.innerHTML = '🛰️ Satellite View';
    button.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer';
    button.style.border = 'none';
    button.style.padding = '8px 12px';
    button.style.fontSize = '14px';
    
    button.addEventListener('click', toggleTrackingMapLayer);
    
    buttonDiv.appendChild(button);
    document.getElementById('trackingMapContainer').parentElement.style.position = 'relative';
    document.getElementById('trackingMapContainer').parentElement.appendChild(buttonDiv);
}

// ========================================
// DRAW ROUTE
// ========================================

function drawRoute(start, end) {
    console.log('🛣️ Drawing route...');
    
    if (routePath) {
        trackingMap.removeLayer(routePath);
    }
    
    routePath = L.polyline([start, end], {
        color: '#f97316',
        weight: 4,
        opacity: 0.7,
        dashArray: '5, 10'
    }).addTo(trackingMap);
    
    const bounds = L.latLngBounds([start, end]);
    trackingMap.fitBounds(bounds, { padding: [50, 50] });
    
    console.log('✅ Route drawn');
}

// ========================================
// UPDATE DELIVERY BOY LOCATION
// ========================================

function updateDeliveryBoyLocation(order) {
    if (!deliveryBoyMarker || !order.deliveryBoyLat || !order.deliveryBoyLng) {
        return;
    }
    
    deliveryBoyMarker.setLatLng([order.deliveryBoyLat, order.deliveryBoyLng]);
    
    console.log('✅ Delivery boy location updated');
}

// ========================================
// DISPLAY ORDER DETAILS
// ========================================

function displayOrderDetails(order) {
    const detailsDiv = document.getElementById('trackingDetails');
    
    if (!detailsDiv) return;
    
    const statusEmoji = {
        'verified': '✅',
        'preparing': '👨‍🍳',
        'out_for_delivery': '🚗',
        'delivered': '🎉'
    };
    
    const statusText = {
        'verified': 'Food is being prepared',
        'preparing': 'Chef is preparing your order',
        'out_for_delivery': 'Driver is on the way to you',
        'delivered': 'Order delivered! Enjoy!'
    };
    
    detailsDiv.innerHTML = `
        <div class="bg-white rounded-2xl shadow-lg p-6">
            <div class="mb-6">
                <h2 class="text-2xl font-bold mb-2">Order #${order.orderNumber}</h2>
                <p class="text-lg font-bold text-orange-600">
                    ${statusEmoji[order.status] || '⏳'} ${statusText[order.status] || order.status}
                </p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl">
                <div>
                    <p class="text-sm text-gray-600">Delivery Time</p>
                    <p class="text-xl font-bold">${order.deliveryTime || 'Being prepared'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Amount</p>
                    <p class="text-xl font-bold text-green-600">₹${order.totalAmount}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Distance</p>
                    <p class="text-xl font-bold">${order.distance}km</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Status</p>
                    <p class="text-xl font-bold">${order.status}</p>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h3 class="font-bold mb-3">📦 Order Items</h3>
                <ul class="space-y-2">
                    ${(order.orderItems || []).map(item => `
                        <li class="text-sm text-gray-700">
                            • ${item.quantity}x ${item.name} - ₹${item.price}
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            ${order.status === 'out_for_delivery' && order.deliveryBoyName ? `
                <div class="mt-4 bg-blue-50 border-2 border-blue-400 rounded-xl p-4">
                    <p class="text-sm text-gray-600 font-semibold">🚗 Driver Details</p>
                    <p class="text-lg font-bold">${order.deliveryBoyName}</p>
                    <p class="text-sm text-gray-600">📞 ${order.deliveryBoyPhone || 'N/A'}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// ========================================
// LISTEN TO UPDATES
// ========================================

function listenToOrderUpdates(orderId) {
    console.log('🔄 Listening to order updates...');
    
    const unsubscribe = db.collection('orders').doc(orderId).onSnapshot((doc) => {
        const order = doc.data();
        
        if (order) {
            console.log('📍 Order updated:', order.status);
            
            displayOrderDetails(order);
            updateDeliveryBoyLocation(order);
            updateStatusTimeline(order);
        }
    }, (error) => {
        console.error('❌ Error:', error);
    });
    
    // Auto-refresh every 10 seconds
    setInterval(() => {
        db.collection('orders').doc(orderId).get().then(doc => {
            if (doc.exists) {
                const order = doc.data();
                updateDeliveryBoyLocation(order);
            }
        });
    }, 10000);
}

// ========================================
// UPDATE STATUS TIMELINE
// ========================================

function updateStatusTimeline(order) {
    const timelineDiv = document.getElementById('statusTimeline');
    
    if (!timelineDiv) return;
    
    const statuses = [
        { status: 'verified', title: 'Payment Verified', emoji: '✅' },
        { status: 'preparing', title: 'Food Preparing', emoji: '👨‍🍳' },
        { status: 'out_for_delivery', title: 'Out for Delivery', emoji: '🚗' },
        { status: 'delivered', title: 'Delivered', emoji: '🎉' }
    ];
    
    timelineDiv.innerHTML = `
        <div class="mt-6">
            <h3 class="font-bold mb-4">Order Status Timeline</h3>
            <div class="space-y-3">
                ${statuses.map(s => {
                    const statusIndex = statuses.findIndex(st => st.status === order.status);
                    const currentIndex = statuses.findIndex(st => st.status === s.status);
                    const isCompleted = currentIndex <= statusIndex;
                    const isCurrent = s.status === order.status;
                    
                    return `
                        <div class="flex items-center ${isCompleted ? 'opacity-100' : 'opacity-50'}">
                            <div class="w-8 h-8 rounded-full ${isCurrent ? 'bg-orange-500 animate-pulse' : isCompleted ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center text-white font-bold">
                                ${isCompleted ? '✓' : s.emoji.charAt(0)}
                            </div>
                            <div class="ml-4">
                                <p class="font-bold ${isCurrent ? 'text-orange-600' : ''}">${s.title}</p>
                                ${isCurrent ? '<p class="text-sm text-orange-600">In Progress →</p>' : isCompleted ? '<p class="text-sm text-green-600">Completed ✓</p>' : '<p class="text-sm text-gray-500">Pending</p>'}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ========================================
// GET ORDER ID FROM URL
// ========================================

function getOrderIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderId');
}

console.log('✅ Delivery tracking with satellite view loaded');
