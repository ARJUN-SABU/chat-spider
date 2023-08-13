//packages
import { useEffect } from "react";
import { useParams } from "react-router-dom";

function ChatPage() {
  const params = useParams();
  useEffect(() => {
    // fetch(`http://localhost:8000/user-chats-and-groups/${params.userId}`)
    //   .then((data) => data.json())
    //   .then((userDoc) => console.log(userDoc))
    //   .catch((err) => console.log(err));

    fetch(
      `https://chat-spider-backend.vercel.app/user-chats-and-groups/${params.userId}`
    )
      .then((data) => data.json())
      .then((userDoc) => console.log(userDoc))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      <h1>Hello I am the chat page</h1>
    </div>
  );
}

export default ChatPage;
