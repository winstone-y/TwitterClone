const express = require("express");
const app = express();
app.use(express.json());

module.exports = app;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "twitterClone.db");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

let db;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Online");
    });
  } catch (e) {
    console.log(`Database Error: ${e}`);
  }
};

initializeDbAndServer();

////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////

// authorize token
const authenticateToken = (request, response, next) => {
  console.log("authenticateToken");
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload;
        next();
      }
    });
  }
};

// API 1
app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;

  const searchUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  const alreadyRegistered = await db.get(searchUserQuery);

  // response.send("User already exists");
  if (alreadyRegistered !== undefined) {
    response.status(400);
    response.send("User already exists");
    console.log(alreadyRegistered);
  } else if (password.length < 6) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hash = await bcrypt.hash(password, 10);
    const registerUserQuery = `
        INSERT INTO user (
            name,username,password,gender) 
            VALUES ('${name}','${username}','${hash}','${gender}');`;
    await db.run(registerUserQuery);
    response.send("User created successfully");
  }
});

// API 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const searchUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const alreadyRegistered = await db.get(searchUserQuery);
  if (alreadyRegistered === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const validPassword = await bcrypt.compare(
      password,
      alreadyRegistered.password
    );
    if (validPassword) {
      const jwtToken = jwt.sign(username, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3
app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  const { username } = request;
  const getTweetsQuery = `
  `;
  const result = await db.all(getTweetsQuery);

  const convertDbObjectToResponseObject = (object) => {
    return {
      username: object.username,
      tweet: object.tweet,
      dateTime: object.date_time,
    };
  };

  //   const resultList = result.map((object) =>
  //     convertDbObjectToResponseObject(object)
  //   );
  //   response.send(resultList);
});

// // API 4
// app.get("/user/following/", authenticateToken, async (request, response) => {
//   const { username } = request.username;

//   const getFollowersQuery = `
//       SELECT * FROM user
//       LEFT JOIN follower ON
//       user.user_id = follower.follower_user_id;`;
//   const result = await db.all(getFollowersQuery);
//   response.send(result);
//   // convert Database Object To Response Object

//   const convertDbObjectToResponseObject = (object) => {
//     return {
//       name: object.name,
//     };
//   };

//   const resultList = result.map((object) =>
//     convertDbObjectToResponseObject(object)
//   );
//   response.send(resultList);
// });

// // API 11

// app.delete("/tweets/:tweetId/", async (request, response) => {
//   const { tweetId } = request.params;
// });
