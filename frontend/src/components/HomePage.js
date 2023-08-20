//packages
import { useState } from "react";
import { useNavigate } from "react-router";

//components
import Logo from "./Logo";

//styles
import "../styles/HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  const [loginError, setLoginError] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [successfulUserCreation, setSuccessfulUserCreation] = useState("");

  function handleLogin() {
    if (document.querySelector("#loginUserEmail").value === "") {
      //set the error message
      setLoginError("User email cannot be empty.");
      return;
    }

    //check if the user doesn't exist
    fetch(
      `https://chat-spider.onrender.com/check-user-exists/${document
        .querySelector("#loginUserEmail")
        .value.toLowerCase()}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setLoginError("");
          navigate(`/chats`, {
            state: {
              userID: document
                .querySelector("#loginUserEmail")
                .value.toLowerCase(),
            },
          });
        } else {
          setLoginError(`User doesn't exist.`);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleSignUp() {
    if (document.querySelector("#newUserName").value === "") {
      setSignUpError("User name cannot be empty.");
      setSuccessfulUserCreation("");
      return;
    }
    if (document.querySelector("#newUserEmail").value == "") {
      setSignUpError("User email cannot be empty.");
      setSuccessfulUserCreation("");
      return;
    }

    fetch("https://chat-spider.onrender.com/create-new-user", {
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
        if (data.type === "error") {
          setSignUpError("User already exists.");
          setSuccessfulUserCreation("");
        } else {
          //since the user was created,
          //show a green message that the user was created
          //and ask them to login
          setSignUpError("");
          setSuccessfulUserCreation(
            "User was created successfully. Please Login."
          );
        }
      })
      .catch((err) => console.log(err));
  }

  return (
    <div className="homePage">
      <div className="homePage__logoContainer">
        <Logo />
      </div>
      <div className="homePage__login__outer">
        <div className="homePage__login">
          <p>Have an account?</p>
          <input type="text" placeholder="User Email" id="loginUserEmail" />
          {loginError !== "" ? (
            <span className="homePage__errorMessage">{loginError}</span>
          ) : (
            ""
          )}
          <button onClick={handleLogin}>Login</button>
        </div>
      </div>

      <div className="homePage__signUp__outer">
        <div className="homePage__signUp">
          <p>Don't have an account?</p>
          <input type="text" placeholder="User Name" id="newUserName" />
          <input type="email" placeholder="User Email" id="newUserEmail" />
          {signUpError !== "" ? (
            <span className="homePage__errorMessage">{signUpError}</span>
          ) : (
            ""
          )}
          {successfulUserCreation !== "" ? (
            <span className="homePage__userCreationSuccessMessage">
              {successfulUserCreation}
            </span>
          ) : (
            ""
          )}
          <button onClick={handleSignUp}>Create New User</button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
