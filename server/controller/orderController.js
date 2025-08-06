// server/controller/orderController.js

const Order = require('../model/order');

class OrderController {
  // Get all orders
  async getAllOrders(req, res) {
    try {
      const orders = await Order.findAll();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get order by ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create new order
  async createOrder(req, res) {
    try {
      const { user_id, product_name, quantity, price, status } = req.body;
      
      // Basic validation
      if (!user_id || !product_name || !quantity || !price) {
        return res.status(400).json({ error: 'User ID, product name, quantity, and price are required' });
      }
      
      const orderId = await Order.create({
        user_id,
        product_name,
        quantity,
        price,
        status
      });
      
      res.status(201).json({
        id: orderId,
        message: 'Order created successfully'
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update order
  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const { status, quantity, price } = req.body;
      
      const updated = await Order.update(id, {
        status,
        quantity,
        price
      });
      
      if (!updated) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      res.json({ message: 'Order updated successfully' });
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete order
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await Order.delete(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new OrderController();
