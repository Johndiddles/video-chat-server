const mongoose = require("mongoose");

const IceCandidate = new mongoose.Schema({
  candidate: String,
  sdpMid: String,
  sdpMLineIndex: Number,
  usernameFragment: String,
});

const offer = new mongoose.Schema({
  sdp: String,
  type: String,
});

const OfferSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
    },
    offererUserName: {
      type: String,
      required: true,
    },
    offer: offer,
    offerIceCandidates: [IceCandidate],
    answererUserName: {
      type: String,
    },
    answer: offer,
    answererIceCandidates: [IceCandidate],
  },
  {
    timestamps: true,
  }
);

module.exports = {
  Offer: mongoose.model("Offer", OfferSchema),
};
