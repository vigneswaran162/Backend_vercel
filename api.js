const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.disable('x-powered-by');

// express.json/urlencoded are the same body-parser middlewares; one pass is enough
// (previously each body type was registered twice).
app.use(express.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000
}));
app.use(express.json({ limit: "50mb" }));
app.use(cors({
    origin: '*',
    methods: 'GET, POST, PUT, DELETE',
    allowedHeaders: 'Content-Type, Authorization',
}));

const PORT = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URL;

if (!mongoURI) {
  console.error("MongoDB connection string is missing!");
  process.exit(1);
}

// Module scope => reused across warm serverless invocations (one pool per instance).
let connecting = null;
function connectDB() {
  if (!connecting) {
    connecting = mongoose
      .connect(mongoURI)
      .then(() => console.log("MongoDB connected successfully"))
      .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        connecting = null; // allow a retry on a later request instead of staying dead
      });
  }
  return connecting;
}
connectDB();

// If the initial connection failed, retry on the next request (warm instances).
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 0) connectDB();
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
