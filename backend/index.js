const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToDb, getDb } = require("./db");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 8000;
const { Server } = require("socket.io");

//db connection
let db;

connectToDb((err) => {
  if (err) {
    console.log(err);
  } else {
    db = getDb();
  }
});

let server_new = app.listen(PORT, () => {
  console.log(`App is listening at port ${PORT}`);
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

//---------------------------- socket.io settings ------------------------------------------
let usersEmailToSocketMap = new Map();
let usersSocketToEmailMap = new Map();
let io = new Server(server_new, {
  cors: {
    origin: "*",
  },
});
io.on("connection", (socket) => {
  console.log("Socket ID --> " + socket.id);
  socket.on("register-user", (userEmail) => {
    console.log("User's Email ---> " + userEmail);
    usersEmailToSocketMap.set(userEmail, socket);
    usersSocketToEmailMap.set(socket, userEmail);
  });

  socket.on("disconnect", () => {
    // delete usersConnectedToServer[]

    let userEmail = usersSocketToEmailMap.get(socket);
    usersSocketToEmailMap.delete(socket);
    usersEmailToSocketMap.delete(userEmail);
    console.log(userEmail + " has left the chat ");
  });
});

//routes
app.get("/user-chats-and-groups/:userId", (req, res) => {
  db.collection("chat-spider-users")
    .findOne({
      userEmail: req.params.userId,
    })
    .then((doc) => {
      res.status(200).json(doc);
    })
    .catch((err) => console.log(err));
});

app.post("/create-new-user", (req, res) => {
  db.collection("chat-spider-users")
    .findOne({
      userEmail: req.body.userEmail,
    })
    .then((doc) => {
      if (doc) {
        res.status(400).json({
          error: "the user already exists",
        });
      } else {
        db.collection("chat-spider-users")
          .insertOne(req.body)
          .then((res) => console.log(res))
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.log(err));
});

app.post("/create-new-chat", (req, res) => {
  db.collection("chat-spider-users")
    .findOne({
      userEmail: req.body.recipientEmail,
    })
    .then((doc) => {
      if (!doc) {
        res.status(400).json({
          error: "the user with the given email-id doesn't exist",
        });
      }

      // db.collection("chat-spider-users")
      //   .updateOne(
      //     {
      //       userEmail: req.body.senderEmail,
      //     },
      //     {
      //       $push: {
      //         userChats: {
      //           $position: 0,
      //           $each: [
      //             {
      //               type: "singleChat",
      //               participantName: doc.userName,
      //               participantEmail: req.body.recipientEmail,
      //               roomID: req.body.roomID,
      //             },
      //           ],
      //         },
      //       },
      //     }
      //   )
      //   .then((res) => console.log(res))
      //   .catch((err) => {
      //     console.log(err);
      //     res.status(500).json(err);
      //   });

      // db.collection("chat-spider-users")
      //   .updateOne(
      //     {
      //       userEmail: req.body.recipientEmail,
      //     },
      //     {
      //       $push: {
      //         userChats: {
      //           $position: 0,
      //           $each: [
      //             {
      //               type: "singleChat",
      //               participantName: req.body.senderName,
      //               participantEmail: req.body.senderEmail,
      //               roomID: req.body.roomID,
      //             },
      //           ],
      //         },
      //       },
      //     }
      //   )
      //   .then((res) => console.log(res))
      //   .catch((err) => {
      //     console.log(err);
      //     res.status(500).json(err);
      //   });

      // db.collection("chat-spider-chats")
      //   .insertOne({
      //     roomID: req.body.roomID,
      //     type: "singleChat",
      //     messages: [
      //       {
      //         senderName: req.body.senderName,
      //         content: req.body.message,
      //       },
      //     ],
      //   })
      //   .then((res) => console.log(res))
      //   .catch((err) => {
      //     console.log(err);
      //     res.status(500).json(err);
      //   });

      //if recipient is online, we can connect the sender
      //and the recipient to the roomID.
      if (
        usersEmailToSocketMap.has(req.body.senderEmail) &&
        usersEmailToSocketMap.has(req.body.recipientEmail)
      ) {
        usersEmailToSocketMap.get(req.body.senderEmail).join(req.body.roomID);
        usersEmailToSocketMap
          .get(req.body.recipientEmail)
          .join(req.body.roomID);

        usersEmailToSocketMap
          .get(req.body.senderEmail)
          .to(req.body.roomID)
          .emit("new-singleChat-start-message", {
            senderName: req.body.senderName,
            senderEmail: req.body.senderEmail,
            messageContent: req.body.message,
            roomID: req.body.roomID,
          });
      }

      res.status(200).json({
        recipientName: doc.userName,
      });
    })
    .catch((err) => console.log(err));
});

app.post("/create-new-group", (req, res) => {
  //Inserting in Database
  // req.body.participants.forEach((participant) => {
  //   db.collection("chat-spider-users")
  //     .updateOne(
  //       {
  //         userEmail: participant.email,
  //       },
  //       {
  //         $push: {
  //           userChats: {
  //             type: "groupChat",
  //             roomID: req.body.roomID,
  //             groupName: req.body.groupName,
  //           },
  //         },
  //       }
  //     )
  //     .then((res) => console.log(res))
  //     .catch((err) => {
  //       console.log(err);
  //       res.status(500).json(err);
  //     });
  // });

  // db.collection("chat-spider-chats")
  //   .insertOne({
  //     type: "groupChat",
  //     roomID: req.body.roomID,
  //     groupName: req.body.groupName,
  //     participants: req.body.participants,
  //     messages: [],
  //   })
  //   .then((res) => console.log(res))
  //   .catch((err) => {
  //     console.log(err);
  //     res.status(500).json(err);
  //   });

  //update the users who are online
  //that a new group has been created
  //and they have been added to the group
  req.body.participants.forEach((participant) => {
    if (usersEmailToSocketMap.has(participant.email)) {
      usersEmailToSocketMap.get(participant.email).join(req.body.roomID);
    }
  });

  usersEmailToSocketMap
    .get(req.body.senderEmail)
    .to(req.body.roomID)
    .emit("new-group-creation-notification", {
      roomID: req.body.roomID,
      groupName: req.body.groupName,
    });

  res.status(200).json({
    message: "Group creation was successful",
  });
});
