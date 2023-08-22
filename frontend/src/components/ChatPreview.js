/*
  This component is used to render the individual chat selection
  tabs. When clicked, it opens the individual chat window.
  Each chat selection tab has recipient_name / group_name, message_preview,
  the number of messages currently unread by the user. 
*/

//styles
import "../styles/ChatPreview.css";

function ChatPreview({
  chatPreviewName,
  handleOnClickFunction,
  chatPreviewMessage,
  roomID,
  unReadCount,
}) {
  return (
    <div
      className="chatPreview"
      id={`chatPreview-${roomID}`}
      onClick={() => handleOnClickFunction(roomID, chatPreviewName)}
    >
      <div className="chatPreview__left">
        <h3>{chatPreviewName}</h3>
        <p>{chatPreviewMessage}</p>
      </div>
      {unReadCount === 0 ? (
        ""
      ) : (
        <div className="chatPreview__right">
          <p>{unReadCount}</p>
        </div>
      )}
    </div>
  );
}

export default ChatPreview;
