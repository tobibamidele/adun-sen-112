const api = {
    async get(path) {
        const res = await fetch(path);
        return res.json();
    },

    async post(path, data) {
        const res = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async postForm(path, formData) {
        const res = await fetch(path, { method: 'POST', body: formData });
        return res.json();
    },

    async put(path, data) {
        const res = await fetch(path, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async putForm(path, formData) {
        const res = await fetch(path, { method: 'PUT', body: formData });
        return res.json();
    },

    async del(path) {
        const res = await fetch(path, { method: 'DELETE' });
        return res.json();
    },
};

const auth = {
    getUser() {
        const data = localStorage.getItem('user');
        return data ? JSON.parse(data) : null;
    },

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    async check() {
        const data = await api.get('/auth/me');
        if (data.success && data.user) {
            this.setUser(data.user);
            return data.user;
        }
        localStorage.removeItem('user');
        return null;
    },

    async logout() {
        await api.post('/auth/logout');
        localStorage.removeItem('user');
        window.location.href = '/';
    },
};

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

function updateNav(user) {
    const el = document.getElementById('auth-links');
    if (!el) return;

    cart.updateBadge();

    if (user) {
        el.innerHTML = `
            <a href="/orders.html">Orders</a>
            ${user.type === 'seller' ? '<a href="/seller.html">Dashboard</a>' : ''}
            <a href="#" onclick="auth.logout()">Logout</a>
            <span style="color:#888;font-size:0.85rem">${user.email}</span>
        `;
    } else {
        el.innerHTML = `
            <a href="/login.html">Login</a>
            <a href="/register.html">Register</a>
        `;
    }
}

async function initAuth() {
    const user = await auth.check();
    updateNav(user);
    return user;
}

document.addEventListener('DOMContentLoaded', initAuth);
