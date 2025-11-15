const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");

// GET all customers
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET customer by ID
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }
    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST create new customer
router.post("/", async (req, res) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      orderDetails,
      deliveryPerson,
      phone,
    } = req.body;

    // Debug: log incoming payload for troubleshooting
    console.log("POST /api/customers payload:", JSON.stringify(req.body));

    // Validation
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: "Name and address are required fields",
      });
    }

    const customer = new Customer({
      name,
      address,
      phone,
      latitude: latitude || null,
      longitude: longitude || null,
      orderDetails,
      deliveryPerson,
    });

    const savedCustomer = await customer.save();
    // Debug: log saved document id
    console.log("Customer saved with id:", savedCustomer._id);
    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: savedCustomer,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PUT update customer
router.put("/:id", async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE customer
router.delete("/:id", async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);

    if (!deletedCustomer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET today's orders
router.get("/today/orders", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await Customer.find({
      deliveryDate: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      orders: todayOrders,
      count: todayOrders.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
