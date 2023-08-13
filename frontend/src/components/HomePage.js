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
    </div>
  );
}

export default HomePage;
