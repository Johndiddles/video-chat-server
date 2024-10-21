const { ConnectedSocket } = require("../schema/connectedSocket");

const addConnectedSocket = async (socket) => {
  try {
    const newConnectedSocket = new ConnectedSocket(socket);
    return await newConnectedSocket.save();
  } catch (error) {
    throw error;
  }
};

const listConnectedSocketsByRoomId = async (roomId) => {
  try {
    const connectedSockets = await ConnectedSocket.find({ roomId });
    return connectedSockets || [];
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

const getConnectedSocket = async (query) => {
  console.log({ query });
  try {
    const socket = await ConnectedSocket.findOne(query);
    console.log({ socket });
    return socket;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

module.exports = {
  addConnectedSocket,
  listConnectedSocketsByRoomId,
  getConnectedSocket,
};
