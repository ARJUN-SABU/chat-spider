const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToDb, getDb } = require("./db");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

//db connection
let db;
connectToDb((err) => {
  if (!err) {
    app.listen(PORT, () => {
      console.log(`App is listening at port ${PORT}`);
    });
    db = getDb();
  }
});

//middlewares
app.use(express.json());

let whiteListDomains = [
  "http://localhost:3000",
  "https://chat-spider-frontend.vercel.app",
];
let corsOptions = {
  origin: function (origin, callback) {
    if (whiteListDomains.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not Allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));

//routes
app.get("/user-chats-and-groups/:userId", (req, res) => {
  db.collection("chat-spider-users")
    .findOne({
      userId: req.params.userId,
    })
    .then((doc) => {
      res.status(200).json(doc);
    })
    .catch((err) => console.log(err));
});
