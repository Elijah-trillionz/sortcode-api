const mongoose = require('mongoose');

async function connectDB() {
  try {
    const dbConnection = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });

    console.log('database connected to ' + dbConnection.connection.host);
  } catch (err) {
    console.log(err)
    process.exit(1);
  }
}

module.exports = connectDB;
