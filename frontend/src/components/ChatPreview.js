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
