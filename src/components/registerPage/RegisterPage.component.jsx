import React, { useEffect, useState } from "react";
import axios from "axios";
import Loading from "../loading/Loading.component";
import ErrorMessage from "../error/ErrorMessage.component";

import "./register.css";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regPic, setRegPic] = useState(
    "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
  );
  const [regMessage, setRegMessage] = useState(null);
  const [regPicMessage, setRegPicMessage] = useState(null);

  // let navigate = useNavigate();
  // useEffect(() => {
  //   const userInfo = localStorage.getItem("userInfo");
  //   if (userInfo) {
  //     navigate("/lobby");
  //   }
  // }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    console.log(loginEmail, loginPassword);

    try {
      console.log("intry");
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      // setLoading(true);
      const { data } = await axios.post(
        "http://localhost:3001/api/user/login",
        {
          email: loginEmail,
          password: loginPassword,
        },
        config
      );
      console.log(data);
      localStorage.setItem("userInfo", JSON.stringify(data));

      // setLoading(false);
    } catch (error) {
      console.log("incatch");
      alert(error.response.data.message);
      setError(error);
      // setLoading(false);
    }
  };

  const toggleForm = () => {
    const container = document.querySelector(".container");
    container.classList.toggle("active");
  };

  const submitRegisterHandler = async (e) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      alert("Passwords Do Not Match!");
    } else {
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
          },
        };

        // setLoading(true);
        const { data } = await axios.post(
          "http://localhost:3001/api/user/",
          {
            name: regName,
            email: regEmail,
            password: regPassword,
            pic: regPic,
          },
          config
        );
        alert("Registered Successfully");
        localStorage.setItem("userInfo", JSON.stringify(data));
      } catch (error) {
        console.log("incatch");
        alert(error.response.data.message);
        setError(error);
      }
    }
  };

  return (
    <section>
      <div className="container">
        {/* {/* {error && <ErrorMessage variant="danger">{error}</ErrorMessage>} */}
        {loading && <Loading />}
        <div className="user signinBx">
          <div className="imgBx">
            <img
              src="https://raw.githubusercontent.com/WoojinFive/CSS_Playground/master/Responsive%20Login%20and%20Registration%20Form/img1.jpg"
              alt=""
            />
          </div>
          <div className="formBx">
            <form action="" onSubmit={submitHandler}>
              <h2>Sign In</h2>
              <input
                type="text"
                name=""
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input
                type="password"
                name=""
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <input type="submit" name="" value="Login" />
              <p className="signup">
                Don't have an account ?
                <a href="#" onClick={toggleForm}>
                  Sign Up.
                </a>
              </p>
            </form>
          </div>
        </div>
        <div className="user signupBx">
          <div className="formBx">
            <form action="" onSubmit={submitRegisterHandler}>
              <h2>Create an account</h2>
              <input type="file" name="" />
              <input
                type="text"
                name=""
                placeholder="Username"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
              <input
                type="email"
                name=""
                placeholder="Email Address"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <input
                type="password"
                name=""
                placeholder="Create Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
              <input
                type="password"
                name=""
                placeholder="Confirm Password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
              />
              <input type="submit" name="" value="Sign Up" />
              <p className="signup">
                Already have an account ?
                <a href="/" onClick={toggleForm}>
                  Sign in.
                </a>
              </p>
            </form>
          </div>
          <div className="imgBx">
            <img
              src="https://raw.githubusercontent.com/WoojinFive/CSS_Playground/master/Responsive%20Login%20and%20Registration%20Form/img2.jpg"
              alt=""
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
