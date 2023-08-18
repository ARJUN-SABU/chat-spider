//packages
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import uuid4 from "uuid4";

//components
import ChatPreview from "./ChatPreview";
import SingleMessageBlock from "./SingleMessageBlock";

//icons
import { IoSend, IoCloseCircle, IoAppsSharp } from "react-icons/io5";

//styles
import "../styles/ChatPage.css";

function ChatPage() {
  const params = useParams();
  const socket = io("http://localhost:8000/");

  //states
  const [userChatList, setUserChatList] = useState([]);
  const [uniqueContacts, setUniqueContacts] = useState([]);
  const [currentChatWindow, setCurrentChatWindow] = useState(null);
  const [chatWindowName, setChatWindowName] = useState("");
  const [currentUser, setCurrentUser] = useState({
    email: "",
    name: "",
  });
  const [currentLeftPanel, setCurrentLeftPanel] = useState(
    "chatPage__leftSection__bottom--chatsPanel"
  );
  const [chatRoomIDToUnreadMessagesMap, setChatRoomIDToUnreadMessagesMap] =
    useState(new Map());

  const [displayedMessageCountMap, setDisplayedMessageCountMap] = useState(
    new Map()
  );
  const [fetchedAllMessagesMap, setFetchedAllMessagesMap] = useState(new Map());
  const [roomPreviewMessageMap, setRoomPreviewMessageMap] = useState(new Map());
  const [currentChatGroupMembers, setCurrentChatGroupMembers] = useState([]);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userIsTyping, setUserIsTyping] = useState("");
  const [userIsOnline, setUserIsOnline] = useState(false);

  const newSingleChatUserEmail = useRef();
  const newSingleChatMessage = useRef();
  const newGroupName = useRef();
  const groupRoomIDToJoin = useRef();
  const newMessage = useRef();

  useEffect(() => {
    //TODO:
    //replace the local url with production url:
    //https://chat-spider-backend.vercel.app/user-chats-and-groups/${params.userId}
    fetch(`http://localhost:8000/user-chats-and-groups/${params.userId}`)
      .then((data) => data.json())
      .then((userDoc) => {
        setCurrentUser({
          name: userDoc.userName,
          email: userDoc.userEmail,
        });

        setUserChatList(userDoc.userChats);
        setUniqueContacts(getUniqueContacts(userDoc.userChats));
        setChatRoomIDToUnreadMessagesMap((previous) => {
          userDoc.userChats.forEach((userChat) => {
            previous.set(userChat.roomID, []);
            displayedMessageCountMap.set(userChat.roomID, 0);
            fetchedAllMessagesMap.set(userChat.roomID, false);
          });
          return previous;
        });

        userDoc.userChats.forEach((userChat) => {
          fetch(`http://localhost:8000/chat-preview-message/${userChat.roomID}`)
            .then((res) => res.json())
            .then((data) => {
              console.log(data);

              setRoomPreviewMessageMap((previousMap) => {
                previousMap.set(
                  userChat.roomID,
                  data.message.substring(0, 20) + "..."
                );

                return new Map(previousMap);
              });
            })
            .catch((err) => {
              console.log(err);
            });
        });

        setRoomPreviewMessageMap((previousMap) => {
          return new Map(previousMap);
        });

        //Send the current user's email to the server by this hello message
        //so that the server can create an email to socket object mapping and
        //register the current user. This way the server stores the information
        //about whether the current user is still connected to the server or not.
        //Also, we can grab that user (i.e, the user's socket object) with this
        //specific email address and make it join a room when a new individual
        //chat is created.

        socket.emit("register-user", {
          userEmail: params.userId,
          chatRooms: userDoc.userChats.map((userChat) => ({
            roomID: userChat.roomID,
            type: userChat.type,
          })),
        });
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (userChatList.length !== 0) {
      socket.emit("update-user-chat-list", {
        userEmail: currentUser.email,
        userChats: userChatList,
      });
    }
  }, [userChatList]);

  // ------------------------------- socket events -------------------------------
  socket.on("new-singleChat-start-message", (message) => {
    console.log("This is the new message -> ", message);
    chatRoomIDToUnreadMessagesMap.set(message.roomID, []);
    displayedMessageCountMap.set(message.roomID, 0);
    fetchedAllMessagesMap.set(message.roomID, false);
    setRoomPreviewMessageMap((previousMap) => {
      previousMap.set(
        message.roomID,
        `${message.messageContent.substring(0, 20)}...`
      );
      return new Map(previousMap);
    });

    setUserChatList((previous) => {
      let newChatList = [
        {
          type: "singleChat",
          participantName: message.senderName,
          participantEmail: message.senderEmail,
          roomID: message.roomID,
        },
        ...previous,
      ];

      return newChatList;
    });

    setUniqueContacts((previous) => [
      {
        name: message.senderName,
        email: message.senderEmail,
      },
      ...previous,
    ]);

    setCurrentChatWindow((currentSelectedChat) => {
      if (currentSelectedChat === message.roomID) {
        displayMessages(
          [
            {
              senderName: message.senderName,
              senderEmail: message.senderEmail,
              content: message.messageContent,
            },
          ],
          message.roomID
        );
      } else {
        chatRoomIDToUnreadMessagesMap.get(message.roomID).push({
          senderName: message.senderName,
          senderEmail: message.senderEmail,
          content: message.messageContent,
        });
      }

      return currentSelectedChat;
    });
  });

  socket.on("new-group-creation-notification", (message) => {
    // console.log(message);
    // console.log(userChatList);

    console.log("Hohohohohoh group was created");
    chatRoomIDToUnreadMessagesMap.set(message.roomID, []);
    displayedMessageCountMap.set(message.roomID, 0);
    fetchedAllMessagesMap.set(message.roomID, false);
    setRoomPreviewMessageMap((previousMap) => {
      previousMap.set(message.roomID, "");
      return new Map(previousMap);
    });

    setUserChatList((previous) => {
      let newChatList = [
        {
          type: "groupChat",
          groupName: message.groupName,
          roomID: message.roomID,
        },
        ...previous,
      ];
      return newChatList;
    });
  });

  // socket.on("new-user-joined", (message) => {
  //   console.log(message);
  //   setUserChatList((previous) => {
  //     let idx = previous.findIndex(
  //       (userChat) => userChat.roomID === message.roomID
  //     );
  //     let removedChat = previous.splice(idx, 1);
  //     console.log(removedChat);
  //     return [removedChat[0], ...previous];
  //   });

  // });

  socket.on("recieve-new-message", (message) => {
    console.log(message);

    //Bring that chat from to the top from whcih we
    //recieved the latest message.
    setUserChatList((previous) => {
      let idx = previous.findIndex(
        (userChat) => userChat.roomID === message.roomID
      );
      let removedChat = previous.splice(idx, 1)[0];

      let newChatList = [removedChat, ...previous];

      return newChatList;
    });

    setRoomPreviewMessageMap((previousMap) => {
      previousMap.set(message.roomID, `${message.content.substring(0, 20)}...`);
      return new Map(previousMap);
    });

    setCurrentChatWindow((currentSelectedChat) => {
      if (currentSelectedChat === message.roomID) {
        displayMessages(
          [
            {
              senderName: message.senderName,
              senderEmail: message.senderEmail,
              content: message.content,
              dateTime: message.dateTime,
            },
          ],
          message.roomID
        );

        document.querySelector(`#chatWindow-${message.roomID}`).scrollTop =
          document.querySelector(`#chatWindow-${message.roomID}`).scrollHeight;
      } else {
        chatRoomIDToUnreadMessagesMap.get(message.roomID).push({
          senderName: message.senderName,
          senderEmail: message.senderEmail,
          content: message.content,
          dateTime: message.dateTime,
        });
      }

      return currentSelectedChat;
    });
  });

  socket.on("offline-signal", (chatRoomID) => {
    setCurrentChatWindow((previous) => {
      if (previous === chatRoomID) {
        setUserIsOnline(false);
      }
      return previous;
    });
  });

  socket.on("online-signal", (chatRoomID) => {
    setCurrentChatWindow((previous) => {
      if (previous === chatRoomID) {
        setUserIsOnline(true);
      }
      return previous;
    });
  });

  socket.on("recieve-typing-signal", (typingBlock) => {
    setCurrentUser((currentUserValue) => {
      if (typingBlock.userEmail !== currentUserValue.email) {
        setCurrentChatWindow((previous) => {
          if (previous === typingBlock.roomID) {
            setUserIsTyping(typingBlock.message);
          }

          return previous;
        });
      }
      return currentUserValue;
    });
  });

  //------------------------------- utitlity functions -------------------------------

  function displayMessages(messages, chatRoomID) {
    // console.log(messages);

    messages.forEach((message) => {
      let chatWindow = document.querySelector(`#chatWindow-${chatRoomID}`);
      let messageBlock = document.createElement("div");
      messageBlock.classList.add("chatMessage");

      let senderName = document.createElement("p");
      senderName.innerText = message.senderName;
      senderName.classList.add("chatMessage__senderName");

      let messageContent = document.createElement("p");
      messageContent.innerText = message.content;
      messageContent.classList.add("chatMessage__content");

      let dateTime = document.createElement("p");
      dateTime.innerText = String(new Date(message.dateTime))?.split("GMT")[0];
      dateTime.classList.add("chatMessage__dateTime");

      let messageTriangle = document.createElement("div");

      setCurrentUser((previous) => {
        if (message.senderEmail === previous.email) {
          messageBlock.classList.add("currentUserMessage");
          messageTriangle.classList.add("messageTriangleRight");
        } else {
          messageBlock.classList.add("otherUserMessage");
          messageTriangle.classList.add("messageTriangleLeft");
        }

        return previous;
      });

      messageBlock.append(senderName);
      messageBlock.append(messageContent);
      messageBlock.append(dateTime);
      messageBlock.append(messageTriangle);

      // console.log(messageBlock);
      chatWindow.append(messageBlock);
    });
  }

  function displayPreviousMessagesOnTop(messages, roomID) {
    let chatWindow = document.querySelector(`#chatWindow-${roomID}`);
    messages.forEach((message) => {
      let messageBlock = document.createElement("div");
      messageBlock.classList.add("chatMessage");

      let senderName = document.createElement("p");
      senderName.innerText = message.senderName;
      senderName.classList.add("chatMessage__senderName");

      let messageContent = document.createElement("p");
      messageContent.innerText = message.content;
      messageContent.classList.add("chatMessage__content");

      let dateTime = document.createElement("p");
      dateTime.innerText = String(new Date(message.dateTime))?.split("GMT")[0];
      dateTime.classList.add("chatMessage__dateTime");

      let messageTriangle = document.createElement("div");

      if (message.senderEmail === currentUser.email) {
        messageBlock.classList.add("currentUserMessage");
        messageTriangle.classList.add("messageTriangleRight");
      } else {
        messageBlock.classList.add("otherUserMessage");
        messageTriangle.classList.add("messageTriangleLeft");
      }

      messageBlock.append(senderName);
      messageBlock.append(messageContent);
      messageBlock.append(dateTime);
      messageBlock.append(messageTriangle);

      chatWindow.insertBefore(messageBlock, chatWindow.children[0]);
    });
  }

  function getUniqueContacts(userChats) {
    let uniqueContacts = [];

    userChats.forEach((userChat) => {
      if (userChat.type === "singleChat") {
        uniqueContacts.push({
          name: userChat.participantName,
          email: userChat.participantEmail,
        });
      }
    });
    return uniqueContacts;
  }

  //to handle the actions when one of the chat window is opened
  //by selecting a user's chat from the left.
  function handleChatPreviewClick(chatRoomID, chatName) {
    if (!currentChatWindow) {
      document.querySelector("#noWindowSelectedScreen").classList.add("hide");
    } else {
      document
        .querySelector(`#chatWindow-${currentChatWindow}`)
        ?.classList.add("hide");
      document
        .querySelector(`#chatPreview-${currentChatWindow}`)
        .classList.remove("chatPreview--selected");
    }
    document
      .querySelector(`#chatWindow-${chatRoomID}`)
      ?.classList.remove("hide");
    document
      .querySelector(`#chatPreview-${chatRoomID}`)
      .classList.add("chatPreview--selected");

    document
      .querySelector(".chatPage__rightSection__bottom")
      .classList.remove("hide");

    document
      .querySelector(".chatPage__rightSection__top")
      .classList.remove("hide");

    //logic for setting online or offline
    let singleChatMessage = userChatList.filter(
      (userChat) =>
        userChat.type === "singleChat" && userChat.roomID === chatRoomID
    );

    if (singleChatMessage.length > 0) {
      fetch(
        `http://localhost:8000/check-user-online/${chatRoomID}/${currentUser.email}`
      )
        .then((res) => res.json())
        .then((data) => {
          setUserIsOnline(data.online);
        })
        .catch((err) => {
          console.log(err);
        });
    }

    //if this chat was opened for the first time, then
    //only make an API call and get the last 20 chats
    //the current chat were also sent to the database.
    //so they are also included in the last 20 chats.
    if (displayedMessageCountMap.get(chatRoomID) === 0) {
      fetch(`http://localhost:8000/get-messages/${chatRoomID}/0`)
        .then((res) => res.json())
        .then((data) => {
          console.log(data);

          //render these messages
          displayMessages(data.messages.reverse(), chatRoomID);
          document.querySelector(`#chatWindow-${chatRoomID}`).scrollTop =
            document.querySelector(`#chatWindow-${chatRoomID}`).scrollHeight;

          //the cached messages don't have to be considered now
          //because we already got those messages from the db.
          // chatRoomIDToUnreadMessagesMap.set(chatRoomID, []);
          setChatRoomIDToUnreadMessagesMap((previous) => {
            previous.set(chatRoomID, []);
            return new Map(previous);
          });

          //update the count of how many messages have to be skipped
          //next time.
          displayedMessageCountMap.set(chatRoomID, data.messages.length);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      let currentChatMessages = chatRoomIDToUnreadMessagesMap.get(chatRoomID);
      if (currentChatMessages.length !== 0) {
        displayMessages(currentChatMessages, chatRoomID);
        document.querySelector(`#chatWindow-${chatRoomID}`).scrollTop =
          document.querySelector(`#chatWindow-${chatRoomID}`).scrollHeight;

        chatRoomIDToUnreadMessagesMap.set(chatRoomID, []);
        displayedMessageCountMap.set(
          chatRoomID,
          displayedMessageCountMap.get(chatRoomID) + currentChatMessages.length
        );
      }
    }

    setUserIsTyping("");
    setChatWindowName(chatName);
    setCurrentChatWindow(chatRoomID);
  }

  function autoGrowInputArea(event, chatInputType) {
    //When a lot of lines are typed and suddenly everything is selected
    //and deleted then the scroll height still remains that many number of lines.
    //So, first we reduce the height to 20px and then if the text's height > textarea's height
    //then scrolling would happen. So the next line then sets the scroll height
    //as the text area height.
    event.target.style.height = "10px";
    event.target.style.height = event.target.scrollHeight - 20 + "px";

    if (chatInputType === "oldChatInput" && event.target.value === "") {
      sendTypingSignal("");
    }
  }

  function sendTypingSignal(typingMessage) {
    socket.emit("send-typing-signal", {
      userName: currentUser.name,
      userEmail: currentUser.email,
      roomID: currentChatWindow,
      message: typingMessage,
    });
  }

  function toggleUserSelectionForGroup(targetUser) {
    document.querySelector(`.${targetUser}`).classList.toggle("selected");
  }

  function createNewGroup() {
    if (newGroupName.current.value === "") {
      alert("Group name cannot be empty!!");
      return;
    }

    let newGroupMembers = [];
    document
      .querySelectorAll(".chatPage__leftSection__bottom__groupSelectionUser")
      .forEach((userBlock) => {
        if (userBlock.classList.contains("selected")) {
          // console.log(userBlock);

          newGroupMembers.push({
            name: userBlock.querySelector(
              ".chatPage__leftSection__bottom__groupSelectionUser__name"
            ).innerText,
            email: userBlock.querySelector(
              ".chatPage__leftSection__bottom__groupSelectionUser__email"
            ).innerText,
          });
        }
      });

    newGroupMembers.push(currentUser);

    if (newGroupMembers.length == 1) {
      alert("Group cannot be empty!");
      return;
    }
    console.log(newGroupMembers);

    let roomID = uuid4();
    fetch("http://localhost:8000/create-new-group", {
      method: "Post",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        roomID: `group-${roomID}`,
        groupName: newGroupName.current.value,
        participants: newGroupMembers,
        senderEmail: currentUser.email,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);

        setUserChatList((previous) => {
          let newChatList = [
            {
              type: "groupChat",
              groupName: newGroupName.current.value,
              roomID: `group-${roomID}`,
            },
            ...previous,
          ];

          return newChatList;
        });

        chatRoomIDToUnreadMessagesMap.set(`group-${roomID}`, []);
        displayedMessageCountMap.set(`group-${roomID}`, 0);
        fetchedAllMessagesMap.set(`group-${roomID}`, false);
        setRoomPreviewMessageMap((previousMap) => {
          previousMap.set(`group-${roomID}`, "");
          return new Map(previousMap);
        });
        handleLeftPanel("chatPage__leftSection__bottom--chatsPanel");
        setTimeout(() => {
          handleChatPreviewClick(`group-${roomID}`, newGroupName.current.value);
        }, 100);
      })
      .catch((err) => console.log(err));
  }

  function handleLeftPanel(panelToOpen) {
    document.querySelector(`.${currentLeftPanel}`).classList.add("hide");
    document.querySelector(`.${panelToOpen}`).classList.remove("hide");
    setCurrentLeftPanel(panelToOpen);
  }

  function handleNewSingleChat() {
    if (newSingleChatUserEmail.current.value === "") {
      alert("User email cannot be empty!");
      return;
    }

    let sameEmailChat = userChatList.filter(
      (chat) =>
        chat.type === "singleChat" &&
        chat.participantEmail === newSingleChatUserEmail.current.value
    );
    if (sameEmailChat.length > 0) {
      handleLeftPanel("chatPage__leftSection__bottom--chatsPanel");
      handleChatPreviewClick(
        sameEmailChat[0].roomID,
        sameEmailChat[0].participantName
      );

      if (newSingleChatMessage.current.value === "") {
        return;
      }

      socket.emit("send-new-message", {
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        content: newSingleChatMessage.current.value,
        roomID: sameEmailChat[0].roomID,
      });
    } else {
      //new chat
      let roomID = `single-${uuid4()}`;

      fetch("http://localhost:8000/create-new-chat", {
        method: "POST",
        body: JSON.stringify({
          senderName: currentUser.name,
          senderEmail: currentUser.email,

          recipientEmail: newSingleChatUserEmail.current.value,
          message:
            newSingleChatMessage.current.value === ""
              ? "Hi!"
              : newSingleChatMessage.current.value,
          roomID: roomID,
        }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setUserChatList((previous) => {
            let newChatList = [
              {
                type: "singleChat",
                participantName: data.recipientName,
                participantEmail: newSingleChatUserEmail.current.value,
                roomID: roomID,
              },
              ...previous,
            ];

            return newChatList;
          });

          setUniqueContacts([
            {
              name: data.recipientName,
              email: newSingleChatUserEmail.current.value,
            },
            ...uniqueContacts,
          ]);

          chatRoomIDToUnreadMessagesMap.set(roomID, [
            {
              senderName: currentUser.name,
              senderEmail: currentUser.email,
              content:
                newSingleChatMessage.current.value === ""
                  ? "Hi!"
                  : newSingleChatMessage.current.value,
            },
          ]);

          setRoomPreviewMessageMap((previousMap) => {
            previousMap.set(
              roomID,
              newSingleChatMessage.current.value === ""
                ? "Hi!"
                : `${newSingleChatMessage.current.value.substring(0, 20)}...`
            );
            return new Map(previousMap);
          });

          handleLeftPanel("chatPage__leftSection__bottom--chatsPanel");
          setTimeout(() => {
            handleChatPreviewClick(roomID, data.recipientName);
          }, 100);
        })
        .catch((err) => console.log(err));
    }
  }

  function handleGroupJoining() {
    if (groupRoomIDToJoin.current.value === "") {
      alert("Group ID cannot be empty!");
      return;
    }

    let sameRoomIDGroup = userChatList.filter((userChat) => {
      if (
        userChat.type === "groupChat" &&
        userChat.roomID === groupRoomIDToJoin.current.value
      )
        return userChat;
    });

    if (sameRoomIDGroup.length > 0) {
      handleLeftPanel("chatPage__leftSection__bottom--chatsPanel");
      handleChatPreviewClick(
        sameRoomIDGroup[0].roomID,
        sameRoomIDGroup[0].groupName
      );
      return;
    }

    fetch("http://localhost:8000/join-new-group", {
      method: "post",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        roomID: groupRoomIDToJoin.current.value,
        userEmail: currentUser.email,
        userName: currentUser.name,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setUserChatList((previous) => {
          let newChatList = [
            {
              type: "groupChat",
              roomID: groupRoomIDToJoin.current.value,
              groupName: data.groupName,
            },
            ...previous,
          ];

          return newChatList;
        });

        handleLeftPanel("chatPage__leftSection__bottom--chatsPanel");
        chatRoomIDToUnreadMessagesMap.set(groupRoomIDToJoin.current.value, []);
        displayedMessageCountMap.set(groupRoomIDToJoin.current.value, 0);
        fetchedAllMessagesMap.set(groupRoomIDToJoin.current.value, false);

        //get the latest message of the group
        fetch(
          `http://localhost:8000/chat-preview-message/${groupRoomIDToJoin.current.value}`
        )
          .then((res) => res.json())
          .then((data) => {
            console.log(data);
            setRoomPreviewMessageMap((previousMap) => {
              previousMap.set(
                groupRoomIDToJoin.current.value,
                `${data.message.substring(0, 20)}...`
              );
              return new Map(previousMap);
            });
          })
          .catch((err) => {
            console.log(err);
          });

        setTimeout(() => {
          handleChatPreviewClick(
            groupRoomIDToJoin.current.value,
            data.groupName
          );
        }, 100);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function sendMessage() {
    if (newMessage.current.value === "") {
      alert("Message cannot be empty!");
      return;
    }

    socket.emit("send-new-message", {
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      content: newMessage.current.value,
      roomID: currentChatWindow,
    });

    newMessage.current.value = "";
    newMessage.current.style.height = "20px";
    sendTypingSignal("");
  }

  function handleChatWindowScrolling(roomID) {
    if (document.querySelector(`#chatWindow-${roomID}`).scrollTop == 0) {
      if (!loadingMessages && !fetchedAllMessagesMap.get(roomID)) {
        setLoadingMessages(true);
        fetch(
          `http://localhost:8000/get-messages/${roomID}/${displayedMessageCountMap.get(
            roomID
          )}`
        )
          .then((res) => res.json())
          .then((data) => {
            console.log(data);
            setLoadingMessages(false);

            if (data.messages.length === 0) {
              // fetchedAllMessagesMap
              fetchedAllMessagesMap.set(roomID, true);
            } else {
              displayedMessageCountMap.set(
                roomID,
                displayedMessageCountMap.get(roomID) + data.messages.length
              );

              displayPreviousMessagesOnTop(data.messages, roomID);
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
      console.log(loadingMessages);
    }
  }

  function closeCurrentChatWindow() {
    document
      .querySelector(`#chatWindow-${currentChatWindow}`)
      .classList.add("hide");
    document.querySelector("#noWindowSelectedScreen").classList.remove("hide");

    document
      .querySelector(".chatPage__rightSection__bottom")
      .classList.add("hide");

    document
      .querySelector(".chatPage__rightSection__top")
      .classList.add("hide");
    document
      .querySelector(`#chatPreview-${currentChatWindow}`)
      .classList.remove("chatPreview--selected");

    handleLeftPanel("chatPage__leftSection__bottom--chatsPanel");
    setCurrentChatWindow(null);
  }

  function showGroupMembers() {
    fetch(`http://localhost:8000/group-members-list/${currentChatWindow}`)
      .then((res) => res.json())
      .then((data) => {
        setCurrentChatGroupMembers(data);
      })
      .catch((err) => {
        console.log(err);
      });
    handleLeftPanel("chatPage__leftSection__bottom--showGroupMembersPanel");
  }

  function copyUserEmail() {
    fetch(`http://localhost:8000/get-user-email/${currentChatWindow}`)
      .then((res) => res.json())
      .then((doc) => {
        navigator.clipboard.writeText(
          doc.members.filter((member) => member != currentUser.email)[0]
        );
        document
          .querySelector(".chatPage__rightSection__top__chatOptions")
          .classList.toggle("hide");
      })
      .catch((err) => console.log(err));
  }

  return (
    <div className="chatPage">
      <div className="chatPage__leftSection">
        <div className="chatPage__leftSection__top">
          <div className="chatPage__leftSection__top__userDetails">
            <h2>{currentUser.name}</h2>
            <p>{currentUser.email}</p>
          </div>
          <div className="chatPage__leftSection__top__optionsSection">
            <button
              className="chatPage__leftSection__top__optionsSection__moreOptions"
              onClick={() => {
                handleLeftPanel("chatPage__leftSection__bottom--MenuPanel");
                document
                  .querySelector(
                    ".chatPage__leftSection__top__optionsSection__closeOptions"
                  )
                  .classList.remove("hide");
              }}
            >
              More Options
            </button>
            <button
              className="chatPage__leftSection__top__optionsSection__closeOptions hide"
              onClick={() => {
                handleLeftPanel("chatPage__leftSection__bottom--chatsPanel");
                document
                  .querySelector(
                    ".chatPage__leftSection__top__optionsSection__closeOptions"
                  )
                  .classList.add("hide");
              }}
            >
              Back to Chats
            </button>
          </div>
        </div>

        <div className="chatPage__leftSection__bottom chatPage__leftSection__bottom--chatsPanel">
          {userChatList.map((userChat) =>
            userChat.type === "singleChat" ? (
              <ChatPreview
                key={`chatPreview-${userChat.roomID}`}
                chatPreviewName={userChat.participantName}
                chatPreviewMessage={roomPreviewMessageMap.get(userChat.roomID)}
                roomID={userChat.roomID}
                handleOnClickFunction={handleChatPreviewClick}
                unReadCount={
                  chatRoomIDToUnreadMessagesMap.get(userChat.roomID).length
                }
              />
            ) : (
              <ChatPreview
                key={`chatPreview-${userChat.roomID}`}
                chatPreviewName={userChat.groupName}
                chatPreviewMessage={roomPreviewMessageMap.get(userChat.roomID)}
                roomID={userChat.roomID}
                handleOnClickFunction={handleChatPreviewClick}
                unReadCount={
                  chatRoomIDToUnreadMessagesMap.get(userChat.roomID).length
                }
              />
            )
          )}
        </div>

        <div className="chatPage__leftSection__bottom chatPage__leftSection__bottom--MenuPanel hide">
          <p
            onClick={() =>
              handleLeftPanel(
                "chatPage__leftSection__bottom--newSingleChatPanel"
              )
            }
          >
            New Conversation
          </p>
          <p
            onClick={() =>
              handleLeftPanel(
                "chatPage__leftSection__bottom--joinNewGroupPanel"
              )
            }
          >
            Join Group
          </p>
          <p
            onClick={() => {
              handleLeftPanel(
                "chatPage__leftSection__bottom--createNewGroupPanel"
              );
            }}
          >
            Create Group
          </p>
        </div>
        <div className="chatPage__leftSection__bottom chatPage__leftSection__bottom--newSingleChatPanel hide">
          <p>New Conversation</p>

          <input
            placeholder="Enter Email"
            type="email"
            ref={newSingleChatUserEmail}
          />
          <textarea
            placeholder="Say Hi"
            ref={newSingleChatMessage}
            onChange={(event) => autoGrowInputArea(event, "newChatInput")}
          />
          <button onClick={handleNewSingleChat}>Send</button>
        </div>
        <div className="chatPage__leftSection__bottom chatPage__leftSection__bottom--joinNewGroupPanel hide">
          <p>Join Group</p>
          <input
            type="text"
            placeholder="Enter Group ID"
            ref={groupRoomIDToJoin}
          />
          <button onClick={handleGroupJoining}>Join</button>
        </div>
        <div className="chatPage__leftSection__bottom chatPage__leftSection__bottom--createNewGroupPanel hide">
          <p className="chatPage__leftSection__bottom--createNewGroupPanel__heading">
            Create Group
          </p>
          <input placeholder="Enter Group Name" ref={newGroupName} />
          <p className="chatPage__leftSection__bottom--createNewGroupPanel__heading2">
            Select Members
          </p>
          <div>
            {uniqueContacts.map((contact, index) => (
              <div
                className={`chatPage__leftSection__bottom__groupSelectionUser groupUser-${index}`}
                onClick={() =>
                  toggleUserSelectionForGroup(`groupUser-${index}`)
                }
              >
                <p className="chatPage__leftSection__bottom__groupSelectionUser__name">
                  {contact.name}
                </p>
                <p className="chatPage__leftSection__bottom__groupSelectionUser__email">
                  {contact.email}
                </p>
              </div>
            ))}
          </div>
          <button onClick={createNewGroup}>Create a new group</button>
        </div>

        <div className="chatPage__leftSection__bottom chatPage__leftSection__bottom--showGroupMembersPanel hide">
          {currentChatGroupMembers.map((groupMember) => (
            <div className="chatPage__leftSection__bottom--showGroupMembersPanel__memberInfo">
              <p className="chatPage__leftSection__bottom--showGroupMembersPanel__memberInfo__name">
                {groupMember.name}
              </p>
              <p className="chatPage__leftSection__bottom--showGroupMembersPanel__memberInfo__email">
                {groupMember.email}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="chatPage__rightSection">
        <div className="chatPage__rightSection__top hide">
          <div className="chatPage__rightSection__top__chatInfo">
            <h2>{chatWindowName}</h2>
            {currentChatWindow?.includes("group") ? (
              userIsTyping === "" ? (
                ""
              ) : (
                <p>{userIsTyping}</p>
              )
            ) : (
              <p>
                {userIsTyping !== ""
                  ? userIsTyping
                  : userIsOnline
                  ? "online"
                  : "offline"}
              </p>
            )}
          </div>
          <button
            className="chatPage__rightSection__top__chatOptionsToggler"
            onClick={() => {
              document
                .querySelector(".chatPage__rightSection__top__chatOptions")
                .classList.toggle("hide");
            }}
          >
            <IoAppsSharp size={23} />
          </button>
          <div className="chatPage__rightSection__top__chatOptions hide">
            {currentChatWindow?.includes("group") ? (
              <>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentChatWindow);
                    document
                      .querySelector(
                        ".chatPage__rightSection__top__chatOptions"
                      )
                      .classList.toggle("hide");
                  }}
                >
                  Copy Group ID
                </button>
                <button
                  onClick={() => {
                    showGroupMembers();
                    document
                      .querySelector(
                        ".chatPage__rightSection__top__chatOptions"
                      )
                      .classList.toggle("hide");
                  }}
                >
                  Show Members
                </button>
              </>
            ) : (
              <button onClick={copyUserEmail}>Copy User Email</button>
            )}

            <button
              onClick={() => {
                closeCurrentChatWindow();

                document
                  .querySelector(".chatPage__rightSection__top__chatOptions")
                  .classList.toggle("hide");
              }}
            >
              Close Chat
            </button>
          </div>
        </div>
        <div className="chatPage__rightSection__middle">
          <div
            className="chatPage__rightSection__middle__liveChatWindow"
            id="noWindowSelectedScreen"
          >
            <p>No window is selected right now</p>
          </div>

          {userChatList.map((userChat) => (
            <div
              key={`chatWindow-${userChat.roomID}`}
              className="chatPage__rightSection__middle__liveChatWindow hide"
              id={`chatWindow-${userChat.roomID}`}
              onScroll={() => handleChatWindowScrolling(userChat.roomID)}
            ></div>
          ))}
        </div>
        <div className="chatPage__rightSection__bottom hide">
          {/* <div>Adding smiley selector later</div> */}
          <textarea
            className="chatPage__rightSection__bottom__inputArea"
            onChange={(event) => autoGrowInputArea(event, "oldChatInput")}
            onKeyDown={() =>
              sendTypingSignal(`${currentUser.name} is typing...`)
            }
            ref={newMessage}
            placeholder="Type your message here..."
          />

          <button
            className="chatPage__rightSection__bottom__sendMessage"
            onClick={sendMessage}
          >
            <IoSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
