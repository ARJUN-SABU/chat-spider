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
  socket.on("register-user", (userBlock) => {
    console.log("User's Email ---> " + userBlock.userEmail);
    usersEmailToSocketMap.set(userBlock.userEmail, socket);
    usersSocketToEmailMap.set(socket, userBlock.userEmail);

    //join the user to all the rooms the user is part of
    userBlock.chatRooms.forEach((chatRoom) => {
      socket.join(chatRoom.roomID);

      //also send the rooms that the user has come online
      if (chatRoom.type === "singleChat") {
        socket.to(chatRoom.roomID).emit("online-signal", chatRoom.roomID);
      }
    });
  });

  socket.on("send-new-message", (messageBlock) => {
    console.log(messageBlock);

    //send to the room.
    socket.to(messageBlock.roomID).emit("recieve-new-message", messageBlock);

    //send to the database
    // db.collection("chat-spider-chats")
    //   .updateOne(
    //     {
    //       roomID: messageBlock.roomID,
    //     },
    //     {
    //       $push: {
    //         messages: {
    //           $position: 0,
    //           $each: [
    //             {
    //               senderName: messageBlock.senderName,
    //               senderEmail: messageBlock.senderEmail,
    //               content: messageBlock.content,
    //             },
    //           ],
    //         },
    //       },
    //     }
    //   )
    //   .then((doc) => {
    //     console.log(doc);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     res.status(500).json({
    //       error_message: "message couldn't be sent",
    //     });
    //   });
  });

  socket.on("send-typing-signal", (typingBlock) => {
    socket.to(typingBlock.roomID).emit("recieve-typing-signal", typingBlock);
  });

  socket.on("disconnect", () => {
    // delete usersConnectedToServer[]

    let userEmail = usersSocketToEmailMap.get(socket);
    usersSocketToEmailMap.delete(socket);
    usersEmailToSocketMap.delete(userEmail);
    console.log(userEmail + " has left the chat ");

    //update the chats to which the current user is connected
    //that the current user has gone offline
    db.collection("chat-spider-users")
      .findOne(
        {
          userEmail: userEmail,
        },
        {
          projection: {
            _id: 0,
            "userChats.roomID": 1,
            "userChats.type": 1,
          },
        }
      )
      .then((doc) => {
        console.log(doc);
        doc.userChats.forEach((userChat) => {
          if (userChat.type === "singleChat") {
            socket.to(userChat.roomID).emit("offline-signal", userChat.roomID);
          }
        });
      })
      .catch((err) => console.log(err));
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
  //             $position: 0,
  //             $each: [
  //               {
  //                 type: "groupChat",
  //                 roomID: req.body.roomID,
  //                 groupName: req.body.groupName,
  //               },
  //             ],
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

app.post("/join-new-group", (req, res) => {
  console.log(req.body);

  db.collection("chat-spider-chats")
    .findOne(
      {
        roomID: req.body.roomID,
      },
      {
        projection: {
          groupName: 1,
        },
      }
    )
    .then((doc) => {
      console.log(doc);
      if (!doc) {
        res.status(400).json({
          error_message: "Group with the given ID doesn't exist",
        });
      }

      // update the database
      // db.collection("chat-spider-chats")
      //   .updateOne(
      //     {
      //       roomID: req.body.roomID,
      //     },
      //     {
      //       $push: {
      //         participants: {
      //           name: req.body.userName,
      //           email: req.body.userEmail,
      //         },
      //       },
      //     }
      //   )
      //   .then((res) => {
      //     console.log(res);
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //     res.status(500).json({
      //       error_message: "Group couldn't be created",
      //     });
      //   });

      // db.collection("chat-spider-users")
      //   .updateOne(
      //     {
      //       userEmail: req.body.userEmail,
      //     },
      //     {
      //       $push: {
      //         userChats: {
      //           $position: 0,
      //           $each: [
      //             {
      //               type: "groupChat",
      //               roomID: req.body.roomID,
      //               groupName: doc.groupName,
      //             },
      //           ],
      //         },
      //       },
      //     }
      //   )
      //   .then((res) => {
      //     console.log(res);
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //     res.status(500).json({
      //       error_message: "group was not created",
      //     });
      //   });

      //join the group with the given roomID
      //also update the members

      usersEmailToSocketMap.get(req.body.userEmail).join(req.body.roomID);
      usersEmailToSocketMap
        .get(req.body.userEmail)
        .to(req.body.roomID)
        .emit("new-user-joined", {
          userName: req.body.userName,
          userEmail: req.body.userEmail,
          roomID: req.body.roomID,
        });

      res.status(200).json({
        message: "Group joined successfully",
        groupName: doc.groupName,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({
        error_message: "Group with the given ID doesn't exist",
      });
    });
});

app.get("/get-messages/:roomID/:messagesToBeSkipped", (req, res) => {
  db.collection("chat-spider-chats")
    .findOne(
      {
        roomID: req.params.roomID,
      },
      {
        projection: {
          groupName: 0,
          participants: 0,
          roomID: 0,
          type: 0,
          _id: 0,
          messages: {
            $slice: [Number(req.params.messagesToBeSkipped), 5],
          },
        },
      }
    )
    .then((doc) => {
      // console.log(doc);
      res.status(200).json(doc);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
});

app.get("/chat-preview-message/:roomID", (req, res) => {
  db.collection("chat-spider-chats")
    .findOne(
      {
        roomID: req.params.roomID,
      },
      {
        projection: {
          groupName: 0,
          participants: 0,
          roomID: 0,
          type: 0,
          _id: 0,
          messages: {
            $slice: [0, 1],
          },
        },
      }
    )
    .then((doc) => {
      // console.log(doc);
      res.status(200).json({
        message: doc.messages[0].content,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/check-user-online/:roomID/:userEmail", (req, res) => {
  db.collection("chat-spider-chats")
    .findOne(
      {
        roomID: req.params.roomID,
      },
      {
        projection: {
          _id: 0,
          participants: 1,
        },
      }
    )
    .then((doc) => {
      if (!doc) {
        res.status(500).json({
          error_message: "couldn't fetch the document",
        });
      }

      let recipientEmail = doc.participants.filter(
        (participant) => participant.email !== req.params.userEmail
      )[0].email;

      if (usersEmailToSocketMap.get(recipientEmail)) {
        res.status(200).json({
          online: true,
        });
      } else {
        res.status(200).json({
          online: false,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/group-members-list/:roomID", (req, res) => {
  console.log(req.params.roomID);
  db.collection("chat-spider-chats")
    .findOne(
      {
        roomID: req.params.roomID,
      },
      {
        projection: {
          _id: 0,
          participants: 1,
        },
      }
    )
    .then((doc) => {
      res.status(200).json(doc.participants);
    })
    .catch((err) => console.log(err));
});
