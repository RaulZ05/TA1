const DB = {
  async getProducts(filter) {
    const q = filter && filter !== 'todo' ? `?filter=${filter}` : '';
    return Auth.fetch(`/products${q}`);
  },

  async getFeatured() {
    return Auth.fetch('/products/featured');
  },

  async getProductById(id) {
    return Auth.fetch(`/products/${id}`);
  },

  async getNovedades() {
    return Auth.fetch('/products');
  },

  async getOrders() {
    return Auth.fetch('/orders');
  },

  async createOrder(items, total, metodo) {
    return Auth.fetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, monto: total, metodo, envio: true, ubicacion: 'Av. Ramon Castilla 443' })
    });
  },

  async submitContact(data) {
    return Auth.fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getUserProfile() {
    return Auth.fetch('/users/profile');
  },

  async updateUserProfile(data) {
    return Auth.fetch('/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Admin
  async createProduct(data) {
    return Auth.fetch('/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async updateProduct(id, data) {
    return Auth.fetch(`/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async deleteProduct(id) {
    return Auth.fetch(`/products/${id}`, { method: 'DELETE' });
  },

  async updateOrderStatus(id, estado) {
    return Auth.fetch(`/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
  },

  async deleteOrder(id) {
    return Auth.fetch(`/orders/${id}`, { method: 'DELETE' });
  },

  async getUsers() {
    return Auth.fetch('/users');
  },

  async getContacts() {
    return Auth.fetch('/contact');
  }
};
