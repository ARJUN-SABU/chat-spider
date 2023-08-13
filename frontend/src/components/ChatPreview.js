//styles
import "../styles/ChatPreview.css";

function ChatPreview({ chatPreviewName, handleOnClickFunction, roomID }) {
  return (
    <div className="chatPreview" onClick={() => handleOnClickFunction(roomID)}>
      <div className="chatPreview__left">{/* Avatar */}</div>
      <div className="chatPreview__middle">
        <h3>{chatPreviewName}</h3>
        <p>This is the latest message</p>
      </div>
      <div className="chatPreview__right">
        <p>10:03</p>
        <p>2</p>
      </div>
    </div>
  );
}

export default ChatPreview;