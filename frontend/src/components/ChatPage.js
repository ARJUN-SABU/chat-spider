//packages
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import uuid4 from "uuid4";

//components
import ChatPreview from "./ChatPreview";

//icons
import { IoSend, IoCloseCircle } from "react-icons/io5";

//styles
import "../styles/ChatPage.css";

function ChatPage() {
  const params = useParams();
  const socket = io("http://localhost:8000/");

  //states
  const [userChatList, setUserChatList] = useState([]);
  const [uniqueContacts, setUniqueContacts] = useState([]);
  const [currentChatWindow, setCurrentChatWindow] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    email: "",
    name: "",
  });
  const [currentLeftPanel, setCurrentLeftPanel] = useState(
    "chatPage__leftSection__bottom--chatsPanel"
  );

  const newSingleChatUserEmail = useRef();
  const newSingleChatMessage = useRef();
  const newGroupName = useRef();

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
      })
      .catch((err) => console.log(err));

    //Send the current user's email to the server by this hello message
    //so that the server can create an email to socket object mapping and
    //register the current user. This way the server stores the information
    //about whether the current user is still connected to the server or not.
    //Also, we can grab that user (i.e, the user's socket object) with this
    //specific email address and make it join a room when a new individual
    //chat is created.
    socket.emit("register-user", params.userId);
  }, []);

  // ------------------------------- socket events -------------------------------
  socket.on("new-singleChat-start-message", (message) => {
    console.log("This is the new message -> ", message);
    setUserChatList([
      {
        type: "singleChat",
        participantName: message.senderName,
        participantEmail: message.senderEmail,
        roomID: message.roomID,
      },
      ...userChatList,
    ]);

    setUniqueContacts([
      {
        name: message.senderName,
        email: message.senderEmail,
      },
      ...uniqueContacts,
    ]);

    // setTimeout(() => {
    //   handleChatPreviewClick(message.roomID);
    // }, 100);
  });

  socket.on("new-group-creation-notification", (message) => {
    console.log(message);
    console.log(userChatList);
    setUserChatList([
      {
        type: "groupChat",
        groupName: message.groupName,
        roomID: message.roomID,
      },
      ...userChatList,
    ]);
  });

  //------------------------------- utitlity functions -------------------------------

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
  function handleChatPreviewClick(chatRoomID) {
    if (!currentChatWindow) {
      document.querySelector("#noWindowSelectedScreen").classList.add("hide");
    } else {
      document
        .querySelector(`#chatWindow-${currentChatWindow}`)
        ?.classList.add("hide");
    }
    document
      .querySelector(`#chatWindow-${chatRoomID}`)
      ?.classList.remove("hide");
    setCurrentChatWindow(chatRoomID);
  }

  function autoGrowInputArea(event) {
    //When a lot of lines are typed and suddenly everything is selected
    //and deleted then the scroll height still remains that many number of lines.
    //So, first we reduce the height to 20px and then if the text's height > textarea's height
    //then scrolling would happen. So the next line then sets the scroll height
    //as the text area height.
    event.target.style.height = "20px";
    event.target.style.height = event.target.scrollHeight + "px";
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

        setUserChatList([
          {
            type: "groupChat",
            groupName: newGroupName.current.value,
            roomID: `group-${roomID}`,
          },
          ...userChatList,
        ]);

        handleLeftPanel("chatPage__leftSection__bottom--chatsPanel");
        setTimeout(() => {
          handleChatPreviewClick(`group-${roomID}`);
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
      handleChatPreviewClick(sameEmailChat[0].roomID);
      //send the message using socket......
      // sendMessageToRoomID();
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
          console.log("huehuehuehuehue ---> ", data.recipientName);

          setUserChatList([
            {
              type: "singleChat",
              participantName: data.recipientName,
              participantEmail: newSingleChatUserEmail.current.value,
              roomID: roomID,
            },
            ...userChatList,
          ]);

          setUniqueContacts([
            {
              name: data.recipientName,
              email: newSingleChatUserEmail.current.value,
            },
            ...uniqueContacts,
          ]);

          handleLeftPanel("chatPage__leftSection__bottom--chatsPanel");
          setTimeout(() => {
            handleChatPreviewClick(roomID);
          }, 100);
        })
        .catch((err) => console.log(err));
    }
  }

  return (
    <div className="chatPage">
      <div className="chatPage__leftSection">
        <div className="chatPage__leftSection__top">
          <div>
            {/* User Avatar */}
            <h4>{currentUser.name}</h4>
            {/* User Email */}
          </div>
          <div>
            <button
              onClick={() =>
                handleLeftPanel("chatPage__leftSection__bottom--MenuPanel")
              }
            >
              More Options
            </button>
            <button
              onClick={() =>
                handleLeftPanel("chatPage__leftSection__bottom--chatsPanel")
              }
            >
              <IoCloseCircle />
            </button>
          </div>
        </div>

        <div className="chatPage__leftSection__bottom chatPage__leftSection__bottom--chatsPanel">
          {userChatList.map((userChat) =>
            userChat.type === "singleChat" ? (
              <ChatPreview
                key={`chatPreview-${userChat.roomID}`}
                chatPreviewName={userChat.participantName}
                roomID={userChat.roomID}
                handleOnClickFunction={handleChatPreviewClick}
              />
            ) : (
              <ChatPreview
                key={`chatPreview-${userChat.roomID}`}
                chatPreviewName={userChat.groupName}
                roomID={userChat.roomID}
                handleOnClickFunction={handleChatPreviewClick}
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
            Start a new conversation
          </p>
          <p
            onClick={() =>
              handleLeftPanel(
                "chatPage__leftSection__bottom--joinNewGroupPanel"
              )
            }
          >
            Join a group
          </p>
          <p
            onClick={() => {
              handleLeftPanel(
                "chatPage__leftSection__bottom--createNewGroupPanel"
              );
            }}
          >
            Create a new group
          </p>
          <p>Logout</p>
        </div>
        <div className="chatPage__leftSection__bottom chatPage__leftSection__bottom--newSingleChatPanel hide">
          <p>Start a new conversation</p>

          <input
            placeholder="Enter email"
            type="email"
            ref={newSingleChatUserEmail}
          />
          <textarea
            placeholder="Say Hi!"
            ref={newSingleChatMessage}
            onChange={autoGrowInputArea}
            style={{
              resize: "none",
              maxHeight: "100px",
            }}
          />
          <button onClick={handleNewSingleChat}>Send</button>
        </div>
        <div className="chatPage__leftSection__bottom chatPage__leftSection__bottom--joinNewGroupPanel hide">
          <p>Join a group</p>
          <input type="text" placeholder="Enter the group id" />
        </div>
        <div className="chatPage__leftSection__bottom chatPage__leftSection__bottom--createNewGroupPanel hide">
          <p>Create a new group</p>
          <input placeholder="Enter group name" ref={newGroupName} />
          <p>Select the group participants</p>
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
      </div>
      <div className="chatPage__rightSection">
        <div className="chatPage__rightSection__top">
          <div>
            {/* User/Group Avatar */}
            {/* User/Group Name */}
          </div>
          <div>
            {/* options/menu symbol
             for viewing the group members if it is a group chat*/}
            {/* as well as option to show and copy the group id. */}
            {/* Option to close the chat */}
          </div>
        </div>
        <div className="chatPage__rightSection__middle">
          <div
            className="chatPage__rightSection__middle__liveChatWindow"
            id="noWindowSelectedScreen"
          >
            <p>No window is selected right now234234234234</p>
          </div>

          {userChatList.map((userChat) => (
            <div
              key={`chatWindow-${userChat.roomID}`}
              className="chatPage__rightSection__middle__liveChatWindow hide"
              id={`chatWindow-${userChat.roomID}`}
            >
              {userChat.participantName || userChat.groupName}
            </div>
          ))}
        </div>
        <div className="chatPage__rightSection__bottom">
          {/* <div>Adding smiley selector later</div> */}
          <textarea
            className="chatPage__rightSection__bottom__inputArea"
            onChange={autoGrowInputArea}
          />

          <button className="chatPage__rightSection__bottom__sendMessage">
            <IoSend />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
