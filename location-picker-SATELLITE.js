// ========================================
// LOCATION PICKER WITH SATELLITE VIEW
// LEAFLET + OPENSTREETMAP + ESRI SATELLITE
// 100% FREE!
// ========================================

console.log('📍 Loading location picker with satellite view...');

let selectedLocation = {
    latitude: null,
    longitude: null,
    address: '',
    distance: null
};

let map = null;
let marker = null;
let restaurantMarker = null;
let restaurantCircle = null;
let currentMapLayer = 'street'; // 'street' or 'satellite'

// ========================================
// INITIALIZE LOCATION PICKER
// ========================================

function initializeLocationPicker() {
    console.log('📍 Initializing location picker with satellite view...');
    
    // Restaurant location
    const restaurantLocation = {
        lat: 13.520935985883005,
        lng: 77.237526720881
    };
    
    // Initialize map (centered on restaurant)
    map = L.map('mapContainer').setView([restaurantLocation.lat, restaurantLocation.lng], 15);
    
    // Add street map layer (OpenStreetMap)
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    });
    
    // Add satellite layer (ESRI - FREE!)
    const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
            attribution: 'Tiles © Esri',
            maxZoom: 18
        }
    );
    
    // Add street layer by default
    streetLayer.addTo(map);
    
    // Store layers for toggling
    map.streetLayer = streetLayer;
    map.satelliteLayer = satelliteLayer;
    
    // Add restaurant marker
    restaurantMarker = L.circleMarker([restaurantLocation.lat, restaurantLocation.lng], {
        radius: 12,
        fillColor: '#ef4444',
        color: '#991b1b',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8
    })
    .bindPopup('🍽️ Shreevari Snacks Restaurant')
    .addTo(map);
    
    // Add delivery range circle (10km)
    restaurantCircle = L.circle([restaurantLocation.lat, restaurantLocation.lng], {
        radius: 10000, // 10km in meters
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5'
    }).addTo(map);
    
    // Add map type toggle button
    addMapToggleButton();
    
    // Listen for map clicks
    map.on('click', (e) => {
        placeMarker(e.latlng, restaurantLocation);
    });
    
    // Add "Use Current Location" button
    addCurrentLocationButton(restaurantLocation);
    
    console.log('✅ Location picker initialized with satellite view');
}

// ========================================
// TOGGLE BETWEEN STREET AND SATELLITE
// ========================================

function toggleMapLayer() {
    console.log('🗺️ Toggling map layer...');
    
    if (currentMapLayer === 'street') {
        // Switch to satellite
        map.removeLayer(map.streetLayer);
        map.addLayer(map.satelliteLayer);
        currentMapLayer = 'satellite';
        
        document.getElementById('mapToggleBtn').innerHTML = '🗺️ Street View';
        document.getElementById('mapToggleBtn').title = 'Click to switch to street map';
        
        console.log('✅ Switched to satellite view');
    } else {
        // Switch to street
        map.removeLayer(map.satelliteLayer);
        map.addLayer(map.streetLayer);
        currentMapLayer = 'street';
        
        document.getElementById('mapToggleBtn').innerHTML = '🛰️ Satellite View';
        document.getElementById('mapToggleBtn').title = 'Click to switch to satellite map';
        
        console.log('✅ Switched to street view');
    }
}

// ========================================
// ADD MAP TOGGLE BUTTON
// ========================================

function addMapToggleButton() {
    const buttonDiv = document.createElement('div');
    buttonDiv.style.position = 'absolute';
    buttonDiv.style.top = '10px';
    buttonDiv.style.right = '50px';
    buttonDiv.style.zIndex = '1000';
    
    const button = document.createElement('button');
    button.id = 'mapToggleBtn';
    button.innerHTML = '🛰️ Satellite View';
    button.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer';
    button.style.border = 'none';
    button.style.padding = '8px 12px';
    button.style.fontSize = '14px';
    button.title = 'Click to switch to satellite map';
    
    button.addEventListener('click', toggleMapLayer);
    
    buttonDiv.appendChild(button);
    document.getElementById('mapContainer').parentElement.style.position = 'relative';
    document.getElementById('mapContainer').parentElement.appendChild(buttonDiv);
}

// ========================================
// PLACE MARKER ON MAP
// ========================================

function placeMarker(latLng, restaurantLocation) {
    console.log('📍 Placing marker at:', latLng.lat, latLng.lng);
    
    // Remove previous marker
    if (marker) {
        map.removeLayer(marker);
    }
    
    // Add new marker
    marker = L.circleMarker([latLng.lat, latLng.lng], {
        radius: 10,
        fillColor: '#3b82f6',
        color: '#1e40af',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8
    })
    .bindPopup('📍 Your Location')
    .addTo(map);
    
    // Update location data
    updateLocationData(latLng, restaurantLocation);
    
    console.log('✅ Location marked');
}

// ========================================
// UPDATE LOCATION DATA
// ========================================

function updateLocationData(latLng, restaurantLocation) {
    const distance = calculateDistance(
        restaurantLocation.lat,
        restaurantLocation.lng,
        latLng.lat,
        latLng.lng
    );
    
    selectedLocation = {
        latitude: latLng.lat,
        longitude: latLng.lng,
        address: `Location selected`,
        distance: parseFloat(distance.toFixed(2))
    };
    
    console.log('✅ Location updated:', selectedLocation);
    updateLocationDisplay();
}

// ========================================
// GET CURRENT LOCATION
// ========================================

function getCurrentLocation(restaurantLocation) {
    console.log('📍 Getting current location...');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                console.log('✅ Got current location:', lat, lng);
                
                const latLng = L.latLng(lat, lng);
                
                // Center map on user
                map.setView(latLng, 16);
                
                // Place marker
                placeMarker(latLng, restaurantLocation);
                
                alert('✅ Your location detected!\nYou can click elsewhere on map to adjust it.');
            },
            (error) => {
                console.error('❌ Error getting location:', error);
                alert('❌ Unable to access location.\n\nPlease allow location access or click on map to select location manually');
            }
        );
    } else {
        alert('Geolocation not supported. Click on map to select location.');
    }
}

// ========================================
// ADD CURRENT LOCATION BUTTON
// ========================================

function addCurrentLocationButton(restaurantLocation) {
    const button = document.createElement('button');
    button.innerHTML = '📍 Use Current Location';
    button.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer';
    button.style.position = 'fixed';
    button.style.top = '160px';
    button.style.left = '20px';
    button.style.zIndex = '1000';
    button.style.border = 'none';
    
    button.addEventListener('click', () => {
        getCurrentLocation(restaurantLocation);
    });
    
    document.body.appendChild(button);
}

// ========================================
// UPDATE LOCATION DISPLAY
// ========================================

function updateLocationDisplay() {
    const locationInfo = document.getElementById('selectedLocationInfo');
    
    if (locationInfo) {
        locationInfo.innerHTML = `
            <div class="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 mt-4">
                <p class="text-sm text-gray-600 font-semibold">✅ Location Selected</p>
                <p class="font-bold text-blue-600 text-lg">📍 GPS Coordinates</p>
                <p class="text-sm text-gray-600 mt-2">
                    Latitude: ${selectedLocation.latitude.toFixed(6)}
                </p>
                <p class="text-sm text-gray-600">
                    Longitude: ${selectedLocation.longitude.toFixed(6)}
                </p>
                <p class="text-sm text-gray-600 mt-2">
                    📏 Distance: ${selectedLocation.distance}km from restaurant
                </p>
                ${selectedLocation.distance > 10 ? 
                    '<p class="text-red-600 font-bold mt-2">⚠️ Beyond delivery range (10km)</p>' : 
                    '<p class="text-green-600 font-bold mt-2">✅ Within delivery range</p>'}
            </div>
        `;
    }
}

// ========================================
// CALCULATE DISTANCE (Haversine)
// ========================================

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ========================================
// GET SELECTED LOCATION
// ========================================

function getSelectedLocation() {
    console.log('📍 Getting selected location:', selectedLocation);
    
    if (!selectedLocation.latitude || !selectedLocation.longitude) {
        alert('❌ Please select a location on the map');
        return null;
    }
    
    if (selectedLocation.distance > 10) {
        alert('❌ Selected location is beyond delivery range (10km)');
        return null;
    }
    
    return selectedLocation;
}

console.log('✅ Location picker with satellite view loaded');
