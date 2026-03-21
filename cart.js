// ========================================
// SHREEVARI SNACKS - SHOPPING CART SYSTEM
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
        this.showNotification(`${item.name} added to cart!`);
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

    // Update cart badge in navbar
    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        const count = this.getItemCount();
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    // Show notification
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-24 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
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
        message += `Payment Method: Online Payment (UPI/Card)\n`;
        message += `Status: Payment Pending\n\n`;
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
