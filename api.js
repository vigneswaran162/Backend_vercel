const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.disable('x-powered-by');

// express.json/urlencoded are the same body-parser middlewares; one pass is enough
// (previously each body type was registered twice).
app.use(express.urlencoded({
    limit: "4mb",
    extended: true,
    parameterLimit: 50000
}));
app.use(express.json({ limit: "4mb" }));
app.use(cors({
    origin: '*',
    methods: 'GET, POST, PUT, DELETE',
    allowedHeaders: 'Content-Type, Authorization',
}));

const PORT = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URL;

if (!mongoURI) {
  console.error("MongoDB connection string is missing!");
}

// Module scope => reused across warm serverless invocations (one pool per instance).
let connecting = null;
function connectDB() {
  if (!mongoURI) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose
      .connect(mongoURI, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
      .then(() => console.log("MongoDB connected successfully"))
      .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        connecting = null; // allow a retry on a later request instead of staying dead
      });
  }
  return connecting;
}

// Wait for the DB before handling a request (serverless may freeze after the response).
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) await connectDB();
  next();
});

app.use(require('./routes'));

// Vercel invokes the exported app; only listen when run directly (local dev).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
