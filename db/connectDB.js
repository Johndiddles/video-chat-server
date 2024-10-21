const mongoose = require("mongoose");
require("dotenv").config();

const mongoUri = process.env.mongodb_uri;
console.log({ mongoUri });
const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function connectDB() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(mongoUri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error(error);
  } finally {
    // Ensures that the client will close when you finish/error
    // await mongoose.disconnect();
  }
}
// run().catch(console.dir);

module.exports = connectDB;
