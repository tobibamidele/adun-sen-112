const cart = {
    getItems() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    },

    addItem(product, quantity = 1) {
        const items = this.getItems();
        const existing = items.find(i => i.product_id === product.id);
        if (existing) {
            existing.quantity += quantity;
        } else {
            items.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_storage_path,
                quantity,
            });
        }
        localStorage.setItem('cart', JSON.stringify(items));
        this.updateBadge();
    },

    removeItem(productId) {
        const items = this.getItems().filter(i => i.product_id !== productId);
        localStorage.setItem('cart', JSON.stringify(items));
        this.updateBadge();
    },

    updateQuantity(productId, quantity) {
        const items = this.getItems();
        const item = items.find(i => i.product_id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
                return;
            }
            item.quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(items));
        }
    },

    clear() {
        localStorage.removeItem('cart');
        this.updateBadge();
    },

    getTotal() {
        return this.getItems().reduce((sum, i) => sum + i.price * i.quantity, 0);
    },

    getCount() {
        return this.getItems().reduce((sum, i) => sum + i.quantity, 0);
    },

    updateBadge() {
        const el = document.getElementById('cart-count');
        if (el) el.textContent = this.getCount();
    },
};

document.addEventListener('DOMContentLoaded', () => {
    cart.updateBadge();
});
