const { Offer } = require("../schema/offer");

const createOffer = async (offer) => {
  try {
    const newOffer = new Offer(offer);
    return await newOffer.save();
  } catch (error) {
    throw error;
  }
};

const listOffersByRoomId = async (roomId) => {
  try {
    const offers = await Offer.find({ roomId });
    return offers || [];
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

const getOffer = async (query) => {
  try {
    console.log({ query });
    const offer = await Offer.findOne(query).exec();
    // console.log({ offer });
    return offer;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

const updateOffer = async (query, update) => {
  // console.log({ query, update });
  try {
    const updatedOffer = await Offer.findOneAndUpdate(query, update, {
      returnOriginal: false,
    });
    return updatedOffer;
  } catch (error) {
    console.log({ error });
  }
};

module.exports = {
  createOffer,
  listOffersByRoomId,
  getOffer,
  updateOffer,
};
