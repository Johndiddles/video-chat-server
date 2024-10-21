const mongoose = require("mongoose");

const ConnectedSocketSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    socketId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  ConnectedSocket: mongoose.model("ConnectedSocket", ConnectedSocketSchema),
};
