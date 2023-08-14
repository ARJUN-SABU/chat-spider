//packages
import { useNavigate } from "react-router";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>I am the homePage</h1>
      <input type="text" placeholder="Enter the userId" />
      <button
        onClick={() => {
          navigate(`/chats/${document.querySelector("input").value}`);
        }}
      >
        Login
      </button>

      <br />
      <br />
      <br />

      <input type="text" placeholder="User Name" id="newUserName" />
      <input type="email" placeholder="User Email" id="newUserEmail" />
      <button
        onClick={() => {
          fetch("http://localhost:8000/create-new-user", {
            method: "post",
            body: JSON.stringify({
              userName: document.querySelector("#newUserName").value,
              userEmail: document.querySelector("#newUserEmail").value,
              userChats: [],
            }),
            headers: {
              "Content-type": "application/json",
            },
          });
        }}
      >
        Create New User
      </button>
    </div>
  );
}

export default HomePage;
