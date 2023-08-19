//packages
import { useNavigate } from "react-router";

function HomePage() {
  const navigate = useNavigate();

  function handleLogin() {
    if (document.querySelector("input").value === "") {
      //set the error message
      alert("User email cannot be empty");
      return;
    }

    //check if the user doesn't exist
    fetch(
      `http://localhost:8000/check-user-exists/${document
        .querySelector("input")
        .value.toLowerCase()}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          navigate(`/chats`, {
            state: {
              userID: document.querySelector("input").value.toLowerCase(),
            },
          });
        } else {
          //set the error message
          //User doesn't exist
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleSignUp() {
    if (document.querySelector("#newUserName").value === "") {
      //set the error message
      alert("User name cannot be empty");
      return;
    }
    if (document.querySelector("#newUserEmail").value == "") {
      //set the error message
      alert("User email cannot be empty");
      return;
    }

    fetch("http://localhost:8000/create-new-user", {
      method: "post",
      body: JSON.stringify({
        userName: document.querySelector("#newUserName").value,
        userEmail: document.querySelector("#newUserEmail").value.toLowerCase(),
        userChats: [],
      }),
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.type === "error") {
          //set the error message
          //the user already exists
        } else {
          //since the user was created,
          //show a green message that the user was created
          //and ask them to login
        }
      })
      .catch((err) => console.log(err));
  }

  return (
    <div>
      <h1>ChatSpider</h1>
      <input type="text" placeholder="Enter the userId" />
      <button onClick={handleLogin}>Login</button>

      <input type="text" placeholder="User Name" id="newUserName" />
      <input type="email" placeholder="User Email" id="newUserEmail" />
      <button onClick={handleSignUp}>Create New User</button>
    </div>
  );
}

export default HomePage;
