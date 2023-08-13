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
