//styles
import "../styles/SingleMessageBlock.css";

function SingleMessageBlock({ senderName, messageContent }) {
  return (
    <div>
      <p>{senderName}</p>
      <p>{messageContent}</p>
      <p>date</p>
      <p>time</p>
    </div>
  );
}

export default SingleMessageBlock;
