const http = require("http");
const express = require("express");
require("dotenv").config();

const app = express();
const socketio = require("socket.io");

const connectDB = require("./db/connectDB");
const {
  addConnectedSocket,
  getConnectedSocket,
  listConnectedSocketsByRoomId,
} = require("./db/models/connectedSockets");
const {
  createOffer,
  getOffer,
  listOffersByRoomId,
  updateOffer,
} = require("./db/models/offers");

const expressServer = http.createServer(app);
connectDB();
//create our socket.io server... it will listen to our express port
const io = socketio(expressServer, {
  cors: {
    origin: [
      "https://localhost:3000",
      "https://192.168.0.135:3000",
      "https://viddy-dgnldsjh6-johndiddles-projects.vercel.app",
      "https://viddy-tau.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

expressServer.listen(8181);

io.on("connection", (socket) => {
  // console.log("Someone has connected");
  const userName = socket.handshake.auth.userName;
  const password = socket.handshake.auth.password;
  //   const roomId = socket.handshake.auth.roomId;

  if (password !== "x") {
    socket.disconnect(true);
    return;
  }
  socket.on("join-room", async (roomId) => {
    if (!roomId) {
      socket.disconnect(true);
      return;
    }
    socket.join(roomId);
    console.log(`${userName} joined room ${roomId}`);

    const newSocket = {
      socketId: socket.id,
      userName,
      roomId,
    };

    await addConnectedSocket(newSocket);

    //a new client has joined. If there are any offers available,
    //emit them out
    console.log(
      "%c ALL EXISTING OFFERS BEFORE FILTERING FOR ROOMS: \n",
      "color: yellow"
      // { offers, stringedOffers: JSON.stringify(offers) }
    );

    const roomOffers = await listOffersByRoomId(roomId);

    // console.log({ roomOffers });

    // const roomOffers = offers.filter((offer) => offer.roomId === roomId);
    // console.log({ roomOffers, roomId, id: socket.id });
    if (roomOffers.length) {
      socket.emit("availableOffers", roomOffers);
    }

    socket.on("newOffer", async (newOffer, ackFunction) => {
      // console.log("newOffer!");
      // console.log(newOffer)
      const newOfferToSave = {
        offererUserName: userName,
        offer: newOffer,
        offerIceCandidates: [],
        answererUserName: null,
        answer: null,
        answererIceCandidates: [],
        roomId,
      };
      // offers.push(newOfferToSave);
      const savedOffer = await createOffer(newOfferToSave);
      console.log({ savedOffer });
      //send out to all connected sockets EXCEPT the caller
      console.log("Emmiting newOfferAwaiting");
      socket.to(roomId).emit("newOfferAwaiting", [savedOffer]);
      ackFunction(savedOffer);
    });

    socket.on("newAnswer", async (offerObj, ackFunction) => {
      console.log({ offerObj });
      try {
        console.log("Requested offerer", offerObj.offererUserName);
        //emit this answer (offerObj) back to CLIENT1
        //in order to do that, we need CLIENT1's socketid

        const socketToAnswer = await getConnectedSocket({
          roomId,
          userName: offerObj.offererUserName,
        });
        if (!socketToAnswer) {
          console.log("No matching socket");
          return ackFunction({ message: "could not find a matching socket." });
        }
        //we found the matching socket, so we can emit to it!
        const socketIdToAnswer = socketToAnswer.socketId;
        //we find the offer to update so we can emit it
        const offerToUpdate = await getOffer({
          roomId,
          // offererUserName: offerObj.offererUserName,
        });

        if (!offerToUpdate) {
          console.log("No OfferToUpdate");
          return;
        }
        //send back to the answerer all the iceCandidates we have already collected
        // ackFunction(offerToUpdate.offerIceCandidates);
        ackFunction(offerToUpdate.offerIceCandidates);

        offerToUpdate.answer = offerObj.answer;
        offerToUpdate.answererUserName = userName;

        const updateToSave = {
          roomId: offerToUpdate.roomId,
          offererUserName: offerToUpdate.offererUserName,
          offer: offerToUpdate.offer,
          offerIceCandidates: offerToUpdate.offerIceCandidates,
          answer: offerObj.answer,
          answererUserName: userName,
          answererIceCandidates: offerToUpdate.answererIceCandidates,
        };

        console.log({ updateToSave });

        //socket has a .to() which allows emiting to a "room"
        //every socket has it's own room
        console.log({ socketIdToAnswer });
        socket.to(socketIdToAnswer).emit("answerResponse", updateToSave);

        const updatedOffer = await updateOffer(
          {
            roomId,
            // offererUserName: offerObj.offererUserName,
          },
          updateToSave
        );
        console.log({ updatedOffer });
      } catch (error) {
        console.log({ error });
      }
    });

    socket.on("sendIceCandidateToSignalingServer", async (iceCandidateObj) => {
      console.log(
        "############## sendIceCandidateToSignalingServer #########"?.toUpperCase()
      );
      const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;
      console.log({ didIOffer, iceUserName, iceCandidate });
      // console.log(iceCandidate);
      if (didIOffer) {
        //this ice is coming from the offerer. Send to the answerer
        const offerInOffers = await getOffer({
          roomId,
          // offererUserName: iceUserName,
        });
        // const offerInOffers = offers.find(
        //   (o) => o.offererUserName === iceUserName && o.roomId === roomId
        // );
        if (offerInOffers) {
          // offerInOffers.offerIceCandidates.push(iceCandidate);
          console.log("FOUND OFFER IN OFFERS FOR OFFERER ", offerInOffers);

          const updatedOffer = await updateOffer(
            {
              roomId,
              // offererUserName: offerObj.offererUserName,
            },
            {
              roomId: offerInOffers.roomId,
              offererUserName: offerInOffers.offererUserName,
              offer: offerInOffers.offer,
              offerIceCandidates: [
                ...offerInOffers.offerIceCandidates,
                iceCandidate,
              ],
              answererUserName: offerInOffers.answererUserName,
              answer: offerInOffers.answer,
              answererIceCandidates: offerInOffers.answererIceCandidates,
            }
          );

          console.log({ SENDICECANDIDATE_UPDATEDOFFER: updatedOffer });

          // 1. When the answerer answers, all existing ice candidates are sent
          // 2. Any candidates that come in after the offer has been answered, will be passed through
          if (updatedOffer.answererUserName) {
            //pass it through to the other socket
            const socketToSendTo = await getConnectedSocket({
              roomId,
              userName: offerInOffers.answererUserName,
            });
            console.log({ socketToSendTo });
            // const socketToSendTo = connectedSockets.find(
            //   (s) => s.userName === offerInOffers.answererUserName
            // );
            if (socketToSendTo) {
              console.log("EMITTING RECEIVED_ICECANDIDATE", iceCandidate);
              socket
                .to(socketToSendTo.socketId)
                .emit("receivedIceCandidateFromServer", iceCandidate);
            } else {
              console.log("Ice candidate recieved but could not find answere");
            }
          }
        }
      } else {
        //this ice is coming from the answerer. Send to the offerer
        //pass it through to the other socket
        console.log("finding answerer", { roomId, iceUserName });
        const offerInOffers = await getOffer({
          roomId,
          // answererUserName: iceUserName,
        });
        console.log({ offerInOffers });

        const socketToSendTo = await getConnectedSocket({
          roomId,
          userName: offerInOffers.offererUserName,
        });

        if (socketToSendTo) {
          socket
            .to(socketToSendTo.socketId)
            .emit("receivedIceCandidateFromServer", iceCandidate);
        } else {
          console.log("Ice candidate recieved but could not find offerer");
        }
      }
    });

    // socket.on("disconnect", () => {
    //   const offerToClear = offers.findIndex(
    //     (o) => o.offererUserName === userName && o.roomId === roomId
    //   );
    //   offers.splice(offerToClear, 1);
    //   socket.to(roomId).emit("availableOffers", offers);
    // });
  });
});
