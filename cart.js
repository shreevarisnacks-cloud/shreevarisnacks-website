// ========================================
// SHREEVARI SNACKS - SHOPPING CART SYSTEM
// FIXED: Mobile notifications + Auto-reload
// ========================================

class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.deliveryCharges = {
            '0-3': 20,    // 0-3km: ₹20
            '3-5': 40,    // 3-5km: ₹40
            '5-7': 60,    // 5-7km: ₹60
            '7-10': 80,   // 7-10km: ₹80
        };
        this.maxDeliveryDistance = 10; // km
    }

    // Load cart from localStorage
    loadCart() {
        const saved = localStorage.getItem('shreevari_cart');
        return saved ? JSON.parse(saved) : [];
    }

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('shreevari_cart', JSON.stringify(this.items));
        this.updateCartBadge();
        this.triggerCartReload();
    }

    // Add item to cart
    addItem(item) {
        const existing = this.items.find(i => i.id === item.id);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            this.items.push({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.showNotification(`✓ ${item.name} added to cart!`);
    }

    // Remove item from cart
    removeItem(itemId) {
        this.items = this.items.filter(i => i.id !== itemId);
        this.saveCart();
    }

    // Update item quantity
    updateQuantity(itemId, quantity) {
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(itemId);
            } else {
                item.quantity = quantity;
                this.saveCart();
            }
        }
    }

    // Get cart total
    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Calculate delivery charge based on distance
    calculateDeliveryCharge(distance) {
        if (distance > this.maxDeliveryDistance) {
            return null; // Outside delivery zone
        }
        
        if (distance <= 3) return this.deliveryCharges['0-3'];
        if (distance <= 5) return this.deliveryCharges['3-5'];
        if (distance <= 7) return this.deliveryCharges['5-7'];
        if (distance <= 10) return this.deliveryCharges['7-10'];
        
        return null;
    }

    // Get total with delivery
    getTotal(deliveryCharge = 0) {
        return this.getSubtotal() + deliveryCharge;
    }

    // Get item count
    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    // Clear cart
    clearCart() {
        this.items = [];
        this.saveCart();
    }

    // Update cart badge in navbar (BOTH DESKTOP AND MOBILE)
    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        const badgeMobile = document.getElementById('cartBadgeMobile');
        const count = this.getItemCount();
        
        // Update desktop badge
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
        // Update mobile badge
        if (badgeMobile) {
            if (count > 0) {
                badgeMobile.textContent = count;
                badgeMobile.classList.remove('hidden');
            } else {
                badgeMobile.classList.add('hidden');
            }
        }
    }

    // Show notification (FIXED FOR MOBILE)
    showNotification(message) {
        // Remove any existing notifications
        const existing = document.querySelectorAll('.cart-notification');
        existing.forEach(n => n.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl z-[9999] max-w-sm w-11/12 md:w-auto text-center';
        notification.style.animation = 'slideDown 0.3s ease-out';
        notification.innerHTML = `
            <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="font-semibold">${message}</span>
            </div>
        `;
        
        // Add animation styles if not exists
        if (!document.getElementById('cartNotificationStyles')) {
            const style = document.createElement('style');
            style.id = 'cartNotificationStyles';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        transform: translate(-50%, -100%);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, 0);
                        opacity: 1;
                    }
                }
                @keyframes slideUp {
                    from {
                        transform: translate(-50%, 0);
                        opacity: 1;
                    }
                    to {
                        transform: translate(-50%, -100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-in';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2500);
    }

    // Trigger cart page reload (AUTO-RELOAD FEATURE)
    triggerCartReload() {
        // Dispatch custom event that cart page will listen to
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    }

    // Generate WhatsApp order message
    generateWhatsAppMessage(customerInfo, deliveryCharge) {
        const subtotal = this.getSubtotal();
        const total = this.getTotal(deliveryCharge);
        
        let message = `*🛒 NEW ORDER - SHREEVARI SNACKS*\n\n`;
        message += `*Customer Details:*\n`;
        message += `Name: ${customerInfo.name}\n`;
        message += `Phone: ${customerInfo.phone}\n`;
        message += `Address: ${customerInfo.address}\n`;
        message += `Distance: ${customerInfo.distance}km\n\n`;
        
        message += `*Order Items:*\n`;
        this.items.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   Qty: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}\n`;
        });
        
        message += `\n*Order Summary:*\n`;
        message += `Subtotal: ₹${subtotal}\n`;
        message += `Delivery Charges: ₹${deliveryCharge}\n`;
        message += `*Total Amount: ₹${total}*\n\n`;
        
        message += `*Payment Details:*\n`;
        message += `Method: ${customerInfo.paymentMethod === 'upi' ? 'UPI Payment' : 'QR Code Scan'}\n`;
        message += `Transaction ID: ${customerInfo.transactionId}\n`;
        message += `Status: ✓ Payment Completed\n\n`;
        
        message += `_Order placed on ${new Date().toLocaleString('en-IN')}_`;
        
        return encodeURIComponent(message);
    }
}

// Create global cart instance
const cart = new ShoppingCart();

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
    cart.updateCartBadge();
});
