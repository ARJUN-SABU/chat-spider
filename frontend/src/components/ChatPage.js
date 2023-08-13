//packages
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

//components
import ChatPreview from "./ChatPreview";

//icons
import { IoSend } from "react-icons/io5";

//styles
import "../styles/ChatPage.css";

function ChatPage() {
  const params = useParams();

  //states
  const [userChatList, setUserChatList] = useState([]);
  const [uniqueContacts, setUniqueContacts] = useState([]);
  const [currentChatWindow, setCurrentChatWindow] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    email: "",
    name: "",
  });

  useEffect(() => {
    //TODO:
    //replace the local url with production url:
    //https://chat-spider-backend.vercel.app/user-chats-and-groups/${params.userId}
    fetch(`http://localhost:8000/user-chats-and-groups/${params.userId}`)
      .then((data) => data.json())
      .then((userDoc) => {
        console.log(userDoc);
        setCurrentUser({
          email: userDoc.userEmail,
          name: userDoc.userName,
        });
        setUserChatList(userDoc.userChats);
        setUniqueContacts(
          getUniqueContacts(userDoc.userChats, userDoc.userEmail)
        );
      })
      .catch((err) => console.log(err));
  }, []);

  //utitlity functions

  function getUniqueContacts(userChats, currentEmail) {
    let uniqueEmails = new Set();
    let uniqueContacts = [];

    userChats.forEach((userChat) => {
      if (userChat.type === "singleChat") {
        if (!uniqueEmails.has(userChat.participantEmail)) {
          uniqueEmails.add(userChat.participantEmail);
          uniqueContacts.push({
            name: userChat.participantName,
            email: userChat.participantEmail,
          });
        }
      } else {
        userChat.participants.forEach((participant) => {
          if (
            !uniqueEmails.has(participant.email) &&
            participant.email !== currentEmail
          ) {
            uniqueEmails.add(participant.email);
            uniqueContacts.push(participant);
          }
        });
      }
    });
    console.log(uniqueContacts);
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
        .classList.add("hide");
    }
    document
      .querySelector(`#chatWindow-${chatRoomID}`)
      .classList.remove("hide");
    setCurrentChatWindow(chatRoomID);
  }

  function autoGrowInputArea(event) {
    console.log(event.target);

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
    console.log(newGroupMembers);
  }

  return (
    <div className="chatPage">
      <div className="chatPage__leftSection">
        <div className="chatPage__leftSection__top">
          <div>
            {/* User Avatar */}
            {/* User Name */}
            <h4>UserName</h4>
          </div>
          <div>
            {/* options symbol to create
            group chat and individual chats */}
            {/* Option for logout */}
            <button>More Options</button>
          </div>
        </div>

        <div className="chatPage__leftSection__bottom">
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

        <div className="chatPage__leftSection__bottom">
          <p>Start a new conversation</p>
          <p>Join a group</p>
          <p>Create a new group</p>
          <p>Logout</p>
        </div>
        <div className="chatPage__leftSection__bottom">
          <p>Start a new conversation</p>
          <input placeholder="Enter name" type="text" />
          <input placeholder="Enter email" type="email" />
          <textarea placeholder="Say Hi!" />
          <button>Send</button>
        </div>
        <div className="chatPage__leftSection__bottom">
          <p>Join a group</p>
          <input type="text" placeholder="Enter the group id" />
        </div>
        <div className="chatPage__leftSection__bottom">
          <p>Create a new group</p>
          <input placeholder="Enter group name" />
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
