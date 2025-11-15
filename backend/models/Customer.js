const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [200, "Address cannot be more than 200 characters"],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone cannot be more than 20 characters"],
      validate: {
        validator: function (v) {
          // allow null/empty or a reasonable phone format (digits, spaces, +, -, parentheses)
          if (!v) return true;
          return /^[-+() 0-9]{6,20}$/.test(v);
        },
        message: "Phone number contains invalid characters or is too short",
      },
    },
    latitude: {
      type: Number,
      validate: {
        validator: function (v) {
          return v === null || (v >= -90 && v <= 90);
        },
        message: "Latitude must be between -90 and 90",
      },
    },
    longitude: {
      type: Number,
      validate: {
        validator: function (v) {
          return v === null || (v >= -180 && v <= 180);
        },
        message: "Longitude must be between -180 and 180",
      },
    },
    orderDetails: {
      type: String,
      trim: true,
      maxlength: [500, "Order details cannot be more than 500 characters"],
    },
    deliveryPerson: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "Delivery person name cannot be more than 100 characters",
      ],
    },
    status: {
      type: String,
      enum: ["pending", "delivered", "cancelled"],
      default: "pending",
    },
    deliveryDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
customerSchema.index({ deliveryDate: 1, status: 1 });
customerSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model("Customer", customerSchema);
