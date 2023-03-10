import React, { useEffect, useState } from "react";
import Logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import "./Lobby.styles.css";
import RegisterPage from "../registerPage/RegisterPage.component";

const Lobby = () => {
  let navigate = useNavigate();
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [form, setForm] = useState({});

  const handleForm = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  console.log(form);

  const handleLobbySubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:3001/room", {
      method: "POST",
      body: JSON.stringify(form),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log(data);

    sessionStorage.setItem("display_name", form.userName);

    let inviteCode = form.channelName;
    if (!inviteCode) {
      inviteCode = String(Math.floor(Math.random() * 10000));
    }
    // window.location = `room.html?room=${inviteCode}`;
    navigate(`/${inviteCode}`);
  };

  console.log(roomName);
  useEffect(() => {
    let displayName = sessionStorage.getItem("display_name");
    if (displayName) {
      setName(displayName);
    }
  }, []);

  const userInfo = localStorage.getItem("userInfo");

  return (
    <>
      {userInfo ? (
        <>
          <header id="nav">
            <div className="nav--list">
              <a href="lobby.ejs">
                <h3 id="logo">
                  <img src={Logo} alt="Site Logo" />
                  <span>Blah</span>
                </h3>
              </a>
            </div>

            <div id="nav__links">
              <a className="nav__link" href="/">
                Lobby
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="#ede0e0"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 7.093v-5.093h-3v2.093l3 3zm4 5.907l-12-12-12 12h3v10h7v-5h4v5h7v-10h3zm-5 8h-3v-5h-8v5h-3v-10.26l7-6.912 7 6.99v10.182z" />
                </svg>
              </a>
            </div>
          </header>
          <main id="room__lobby__container">
            <div id="form__container">
              <div id="form__container__header">
                <p>???? Create or Join Room</p>
              </div>

              <form
                id="lobby__form"
                action="/"
                method="post"
                onSubmit={handleLobbySubmit}
              >
                <div className="form__field__wrapper">
                  <label>Your Name</label>
                  <input
                    type="text"
                    name="userName"
                    placeholder="Enter your display name..."
                    onChange={handleForm}
                  />
                </div>

                <div className="form__field__wrapper">
                  <label>Room Name</label>
                  <input
                    type="text"
                    name="channelName"
                    required
                    placeholder="Enter room name..."
                    onChange={handleForm}
                  />
                </div>

                <div className="form__field__wrapper">
                  <button type="submit">
                    Go to Room
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </main>
        </>
      ) : (
        <RegisterPage />
      )}
    </>
  );
};

export default Lobby;
