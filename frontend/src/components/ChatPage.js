//packages
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

//components
import ChatPreview from "./ChatPreview";

//styles
import "../styles/ChatPage.css";

function ChatPage() {
  const params = useParams();

  //states
  const [userChatList, setUserChatList] = useState([]);
  const [currentChatWindow, setCurrentChatWindow] = useState(null);

  useEffect(() => {
    //TODO:
    //replace the local url with production url:
    //https://chat-spider-backend.vercel.app/user-chats-and-groups/${params.userId}
    fetch(`http://localhost:8000/user-chats-and-groups/${params.userId}`)
      .then((data) => data.json())
      .then((userDoc) => {
        console.log(userDoc);
        setUserChatList(userDoc.userChats);
      })
      .catch((err) => console.log(err));
  }, []);

  //utitlity functions
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

  return (
    <div className="chatPage">
      <div className="chatPage__leftSection">
        <div className="chatPage__leftSection__top">
          <div>
            {/* User Avatar */}
            {/* User Name */}
          </div>
          <div>
            {/* options symbol to create
            group chat and individual chats */}
            {/* Option for logout */}
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
        <div className="chatPage__rightSection__bottom"></div>
      </div>
    </div>
  );
}

export default ChatPage;
