import React, { useEffect, useState } from "react";
import Logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import "./Room.styles.css";
import AgoraRTC from "agora-rtc-sdk-ng";
import AgoraRTM from "agora-rtm-sdk";

const Room = () => {
  const [TOKEN, setTOKEN] = useState("");
  const [ROOM, setROOM] = useState("");
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("http://localhost:3001/room");
        const data = await response.json();
        setTOKEN(data.TOKEN);
        setROOM(data.CHANNEL);
      } catch (error) {
        console.error(error);
      }
    }
    fetchData();
  }, []);

  const APP_ID = "bfca05642cd54e18bac76fe16727eb02";
  let navigate = useNavigate();
  let messagesContainer = document.getElementById("messages");
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  const memberContainer = document.getElementById("members__container");
  const chatContainer = document.getElementById("messages__container");

  let activeMemberContainer = false;

  const handleMemberButton = () => {
    if (activeMemberContainer) {
      memberContainer.style.display = "none";
    } else {
      memberContainer.style.display = "block";
    }

    activeMemberContainer = !activeMemberContainer;
  };

  let activeChatContainer = false;

  const handleChatButton = () => {
    if (activeChatContainer) {
      chatContainer.style.display = "none";
    } else {
      chatContainer.style.display = "block";
    }

    activeChatContainer = !activeChatContainer;
  };

  let displayFrame = document.getElementById("stream__box");
  let videoFrames = document.getElementsByClassName("video__container");
  let userIdInDisplayFrame = null;

  let expandVideoFrame = (e) => {
    let child = displayFrame.children[0];
    if (child) {
      document.getElementById("streams__container").appendChild(child);
    }

    displayFrame.style.display = "block";
    displayFrame.appendChild(e.currentTarget);
    userIdInDisplayFrame = e.currentTarget.id;

    for (let i = 0; videoFrames.length > i; i++) {
      if (videoFrames[i].id !== userIdInDisplayFrame) {
        videoFrames[i].style.height = "100px";
        videoFrames[i].style.width = "100px";
      }
    }
  };

  for (let i = 0; videoFrames.length > i; i++) {
    videoFrames[i].addEventListener("click", expandVideoFrame);
  }

  // room_rtc

  let client;

  let uid = sessionStorage.getItem("uid");
  if (!uid) {
    uid = String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem("uid", uid);
  }

  let displayName = sessionStorage.getItem("display_name");
  if (!displayName) {
    navigate("/lobby");
  }

  let rtmClient;
  let channel;

  let localTracks = [];
  let remoteUsers = {};

  let localScreenTracks;
  let sharingScreen = false;

  let joinRoomInit = async () => {
    rtmClient = await AgoraRTM.createInstance(APP_ID);
    console.log(TOKEN);
    await rtmClient.login({ uid, TOKEN });

    await rtmClient.addOrUpdateLocalUserAttributes({ name: displayName });

    channel = await rtmClient.createChannel(ROOM);
    await channel.join();

    channel.on("MemberJoined", handleMemberJoined);
    channel.on("MemberLeft", handleMemberLeft);
    channel.on("ChannelMessage", handleChannelMessage);

    getMembers();
    addBotMessageToDom(`Welcome ${displayName}! 👋`);

    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    await client.join(APP_ID, ROOM, TOKEN, uid);

    client.on("user-published", handleUserPublished);
    client.on("user-left", handleUserLeft);
    joinStream();
  };

  let joinStream = async () => {
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    let player = `<div class="video__container" id="user-container-${uid}">
                      <div class="video-player" id="user-${uid}"></div>
                  </div>`;
    document
      .getElementById("streams__container")
      .insertAdjacentHTML("beforeend", player);

    document
      .getElementById(`user-container-${uid}`)
      .addEventListener("click", expandVideoFrame);

    localTracks[1].play(`user-${uid}`);
    await client.publish([localTracks[0], localTracks[1]]);
  };

  let switchToCamera = async () => {
    let player = `<div class="video__container" id="user-container-${uid}">
                      <div class="video-player" id="user-${uid}"></div>
                  </div>`;
    displayFrame.insertAdjacentHTML("beforeend", player);
    await localTracks[0].setMuted(true);
    await localTracks[1].setMuted(true);

    document.getElementById("mic-btn").classList.remove("active");
    document.getElementById("screen-btn").classList.remove("active");

    localTracks[1].play(`user-${uid}`);
    await client.publish([localTracks[1]]);
  };

  let handleUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    let player = document.getElementById(`user-container-${user.uid}`);
    if (player === null) {
      player = `<div class="video__container" id="user-container-${user.uid}">
                      <div class="video-player" id="user-${user.uid}"></div>
                  </div>`;
      document
        .getElementById("streams__container")
        .insertAdjacentHTML("beforeend", player);

      document
        .getElementById(`user-container-${user.uid}`)
        .addEventListener("click", expandVideoFrame);
    }

    if (displayFrame.style.display) {
      let videoFrame = document.getElementById(`user-container-${user.uid}`);
      videoFrame.style.height = "100px";
      videoFrame.style.width = "100px";
    }

    if (mediaType === "video") {
      user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === "audio") {
      user.audioTrack.play();
    }
  };

  let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();

    if (userIdInDisplayFrame === `user-container-${user.uid}`) {
      displayFrame.style.display = null;

      let videoFrames = document.getElementsByClassName(`video__container`);
      for (let i = 0; videoFrames.length > i; i++) {
        videoFrames[i].style.width = "300px";
        videoFrames[i].style.height = "300px";
      }
    }
  };

  let toggleMic = async (e) => {
    let button = e.currentTarget;

    if (localTracks[0].muted) {
      await localTracks[0].setMuted(false);
      button.classList.add("active");
    } else {
      await localTracks[0].setMuted(true);
      button.classList.remove("active");
    }
  };

  let toggleCamera = async (e) => {
    let button = e.currentTarget;

    if (localTracks[1].muted) {
      await localTracks[1].setMuted(false);
      button.classList.add("active");
    } else {
      await localTracks[1].setMuted(true);
      button.classList.remove("active");
    }
  };

  let toggleScreen = async (e) => {
    let screenButton = e.currentTarget;
    let cameraButton = document.getElementById("camera-btn");

    if (!sharingScreen) {
      sharingScreen = true;

      screenButton.classList.add("active");
      cameraButton.classList.remove("active");
      cameraButton.style.display = "none";

      localScreenTracks = await AgoraRTC.createScreenVideoTrack();

      document.getElementById(`user-container-${uid}`).remove();
      displayFrame.style.display = "block";

      let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`;

      displayFrame.insertAdjacentHTML("beforeend", player);
      document
        .getElementById(`user-container-${uid}`)
        .addEventListener("click", expandVideoFrame);

      userIdInDisplayFrame = `user-container-${uid}`;
      localScreenTracks.play(`user-${uid}`);

      await client.unpublish([localTracks[1]]);
      await client.publish([localScreenTracks]);

      let videoFrames = document.getElementsByClassName("video__container");
      for (let i = 0; videoFrames.length > i; i++) {
        if (videoFrames[i].id !== userIdInDisplayFrame) {
          videoFrames[i].style.height = "100px";
          videoFrames[i].style.width = "100px";
        }
      }
    } else {
      sharingScreen = false;
      cameraButton.style.display = "block";
      document.getElementById(`user-container-${uid}`).remove();
      await client.unpublish([localScreenTracks]);

      switchToCamera();
    }
  };

  let leaveStream = async (e) => {
    e.preventDefault();

    for (let i = 0; localTracks.length > i; i++) {
      localTracks[i].stop();
      localTracks[i].close();
    }

    await client.unpublish([localTracks[0], localTracks[1]]);

    if (localScreenTracks) {
      await client.unpublish([localScreenTracks]);
    }

    document.getElementById(`user-container-${uid}`).remove();

    if (userIdInDisplayFrame === `user-container-${uid}`) {
      displayFrame.style.display = null;

      for (let i = 0; videoFrames.length > i; i++) {
        videoFrames[i].style.height = "300px";
        videoFrames[i].style.width = "300px";
      }
    }

    channel.sendMessage({
      text: JSON.stringify({ type: "user_left", uid: uid }),
    });

    navigate("/lobby");
  };

  let handleMemberJoined = async (MemberId) => {
    addMemberToDom(MemberId);

    let members = await channel.getMembers();
    updateMemberTotal(members);

    let { name } = await rtmClient.getUserAttributesByKeys(MemberId, ["name"]);
    addBotMessageToDom(`Welcome ${name}! 👋`);
  };

  let updateMemberTotal = async (members) => {
    let total = document.getElementById("members__count");
    total.innerText = members.length;
  };

  let handleMemberLeft = async (MemberId) => {
    removeMemberFromDom(MemberId);

    let members = await channel.getMembers();
    updateMemberTotal(members);
  };

  let addMemberToDom = async (MemberId) => {
    let { name } = await rtmClient.getUserAttributesByKeys(MemberId, ["name"]);

    let membersWrapper = document.getElementById("member__list");
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                          <span class="green__icon"></span>
                          <p class="member_name">${name}</p>
                      </div>`;
    membersWrapper.insertAdjacentHTML("beforeend", memberItem);
  };

  let removeMemberFromDom = async (MemberId) => {
    let membersWrapper = document.getElementById(
      `member__${MemberId}__wrapper`
    );
    let name =
      membersWrapper.getElementsByClassName("member_name")[0].textContent;

    addBotMessageToDom(`${name} has left the meeting`);

    membersWrapper.remove();
  };

  let getMembers = async () => {
    let members = await channel.getMembers();
    updateMemberTotal(members);
    for (let i = 0; members.length > i; i++) {
      addMemberToDom(members[i]);
    }
  };

  let sendMessage = async (e) => {
    e.preventDefault();

    let message = e.target.message.value;
    channel.sendMessage({
      text: JSON.stringify({
        type: "chat",
        message: message,
        displayName: displayName,
      }),
    });
    addMessageToDom(displayName, message);
    e.target.reset();
  };

  let addMessageToDom = (name, message) => {
    let messagesWrapper = document.getElementById("messages");

    let newMessage = `<div class="message__wrapper">
                          <div class="message__body">
                              <strong class="message__author">${name}</strong>
                              <p class="message__text">${message}</p>
                          </div>
                      </div>`;

    messagesWrapper.insertAdjacentHTML("beforeend", newMessage);

    let lastMessage = document.querySelector(
      "#messages .message__wrapper:last-child"
    );
    if (lastMessage) {
      lastMessage.scrollIntoView();
    }
  };

  let addBotMessageToDom = (botMessage) => {
    let messagesWrapper = document.getElementById("messages");

    let newMessage = `<div class="message__wrapper">
                          <div class="message__body__bot">
                              <strong class="message__author__bot">🤖Blah</strong>
                              <p class="message__text__bot">${botMessage}</p>
                          </div>
                      </div>`;

    messagesWrapper.insertAdjacentHTML("beforeend", newMessage);

    let lastMessage = document.querySelector(
      "#messages .message__wrapper:last-child"
    );
    if (lastMessage) {
      lastMessage.scrollIntoView();
    }
  };

  let handleChannelMessage = async (messageData, memberId) => {
    console.log("A new Message Received");
    let data = JSON.parse(messageData.text);

    if (data.type === "chat") {
      addMessageToDom(data.displayName, data.message);
    }
  };

  let leaveChannel = async () => {
    await channel.leave();
    await rtmClient.logout();
  };

  joinRoomInit();
  return (
    <>
      <header id="nav">
        <div className="nav--list">
          <button id="members__button" onClick={handleMemberButton}>
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fillRule="evenodd"
              clipRule="evenodd"
            >
              <path
                d="M24 18v1h-24v-1h24zm0-6v1h-24v-1h24zm0-6v1h-24v-1h24z"
                fill="#ede0e0"
              />
              <path d="M24 19h-24v-1h24v1zm0-6h-24v-1h24v1zm0-6h-24v-1h24v1z" />
            </svg>
          </button>
          <a>
            <h3 id="logo">
              <img src={Logo} alt="Site Logo" />
              <span>Blah</span>
            </h3>
          </a>
        </div>

        <div id="nav__links">
          <button id="chat__button" onClick={handleChatButton}>
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fillRule="evenodd"
              fill="#ede0e0"
              clipRule="evenodd"
            >
              <path d="M24 20h-3v4l-5.333-4h-7.667v-4h2v2h6.333l2.667 2v-2h3v-8.001h-2v-2h4v12.001zm-15.667-6l-5.333 4v-4h-3v-14.001l18 .001v14h-9.667zm-6.333-2h3v2l2.667-2h8.333v-10l-14-.001v10.001z" />
            </svg>
          </button>
        </div>
      </header>
      <main className="container">
        <div id="room__container">
          <section id="members__container">
            <div id="members__header">
              <p>Participants</p>
              <strong id="members__count">0</strong>
            </div>

            <div id="member__list"></div>
          </section>

          <section id="stream__container">
            <div id="stream__box"></div>
            <div id="streams__container"></div>

            <div className="stream__actions">
              <button id="camera-btn" className="active" onClick={toggleCamera}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 4h-3v-1h3v1zm10.93 0l.812 1.219c.743 1.115 1.987 1.781 3.328 1.781h1.93v13h-20v-13h3.93c1.341 0 2.585-.666 3.328-1.781l.812-1.219h5.86zm1.07-2h-8l-1.406 2.109c-.371.557-.995.891-1.664.891h-5.93v17h24v-17h-3.93c-.669 0-1.293-.334-1.664-.891l-1.406-2.109zm-11 8c0-.552-.447-1-1-1s-1 .448-1 1 .447 1 1 1 1-.448 1-1zm7 0c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0-2c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z" />
                </svg>
              </button>
              <button id="mic-btn" className="active" onClick={toggleMic}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z" />
                </svg>
              </button>
              <button id="screen-btn" onClick={toggleScreen}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path d="M0 1v17h24v-17h-24zm22 15h-20v-13h20v13zm-6.599 4l2.599 3h-12l2.599-3h6.802z" />
                </svg>
              </button>
              <button id="leave-btn" onClick={leaveStream}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 10v-5l8 7-8 7v-5h-8v-4h8zm-16-8v20h14v-2h-12v-16h12v-2h-14z" />
                </svg>
              </button>
            </div>
          </section>

          <section id="messages__container">
            <div id="messages"></div>

            <form id="message__form" onSubmit={sendMessage}>
              <input
                type="text"
                name="message"
                placeholder="Send a message...."
              />
            </form>
          </section>
        </div>
      </main>
    </>
  );
};

export default Room;
