const express = require('express');
const db = require('../config/firebase');
const axios = require('axios').default;
const auth = require('../middlewares/auth');
const checkConnectivity = require('../middlewares/checkConnectivity');
const router = express.Router();

// GET: /auth/github-signin
// ACCESS: public
router.get('/github-signin', checkConnectivity, async (req, res) => {
  const { code, state } = req.query;

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const token = response.data.access_token;
    const isVerified = await verifyGithubToken(token);
    if (isVerified.errorMsg) {
      return res.status(401).json({
        errorMsg: isVerified.errorMsg,
      });
    }

    const userDBAccount = await createUserInDatabase(isVerified.user);
    if (userDBAccount.status === 500) {
      return res.status(userDBAccount.status).json({
        errorMsg: userDBAccount.errorMsg,
      });
    }

    res.json({
      token,
      msg: 'All done',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      errorMsg: 'Failed to fetch sign in user.',
      error: err,
    });
  }
});

// quick verification
// verify that the token returns a user
const verifyGithubToken = async (token) => {
  try {
    const res = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    if (!res.data.login) {
      return {
        errorMsg: 'Invalid token, authentication failed',
      };
    }

    const { name, id, login, avatar_url } = res.data;

    return {
      msg: 'Login Successful',
      user: {
        fullname: name,
        id,
        username: login,
        avatar_url,
      },
    };
  } catch (err) {
    console.log(err);
    return {
      errorMsg: 'Authentication failed',
    };
  }
};

// GET /auth/discord-signin/:code
// ACCESS: public
router.get('/discord-signin/:code', checkConnectivity, async (req, res) => {
  const { code } = req.params;

  try {
    const accessToken = await axios.post(
      'https://discord.com/api/v8/oauth2/token',
      `client_id=${process.env.DISCORD_CLIENT_ID}&client_secret=${process.env.DISCORD_CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=https://initial-sortcode.vercel.app/sign-in`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const isVerified = await verifyDiscordToken(accessToken.data.access_token);
    if (isVerified.errorMsg) {
      return res.status(401).json({
        errorMsg: isVerified.errorMsg,
      });
    }

    const userDBAccount = await createUserInDatabase(isVerified.user);
    if (userDBAccount.status === 500) {
      return res.status(userDBAccount.status).json({
        errorMsg: userDBAccount.errorMsg,
      });
    }

    res.json({
      msg: 'All done',
      token: accessToken.data.access_token,
      refreshToken: accessToken.data.refresh_token,
      expiresIn: accessToken.data.expires_in,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      errorMsg: 'Failed to sign in user.',
      error: err,
    });
  }
});

const verifyDiscordToken = async (tokenToVerify) => {
  try {
    const res = await axios.get(`https://discord.com/api/v8/users/@me`, {
      headers: {
        Authorization: `Bearer ${tokenToVerify}`,
      },
    });

    if (!res.data.username) {
      return {
        errorMsg: 'Invalid token, authentication failed',
      };
    }

    const { username, id, avatar } = res.data;

    return {
      msg: 'Login Successful',
      user: {
        fullname: username,
        id,
        username,
        avatar_url: `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`,
      },
    };
  } catch (err) {
    return {
      errorMsg: 'Authentication failed',
    };
  }
};

function randomise() {
  return Math.floor(Math.random() * 10);
}

const generateUsername = async (name) => {
  // generates four numbers
  const numbers = [];
  for (let i = 0; i <= 4; i++) {
    numbers.push(randomise());
  }
  const username = `name${numbers.join('')}`; //adds the four numbers to make up a new username
  const alreadyExists = await checkForUsername(username); // checks if the new username exists
  if (alreadyExists) {
    generateUsername(name); // redo
  } else {
    return username;
  }
};

const checkForUsername = async (username) => {
  const users = await db
    .collection('users')
    .where('username', '==', username)
    .get();
  if (users.empty) {
    return false;
  }

  return true;
};

const createUserInDatabase = async (user) => {
  const { fullname, username, id, avatar_url } = user;
  // check if user already exists
  try {
    const usersCol = await db
      .collection('users')
      .where('id', '==', id.toString())
      .get();

    if (!usersCol.empty) {
      return {
        errorMsg: 'This user already exists',
        status: 400,
      };
      // users already existing are regarded as database logging in and therefore will only exit this function
    }

    const usernameAlreadyExists = await checkForUsername(username);
    const newUsername = usernameAlreadyExists
      ? generateUsername(username)
      : username;

    // database signing up
    await db
      .collection('users')
      .doc(id.toString())
      .set({
        id: id.toString(),
        fullname,
        username: newUsername,
        dateJoined: new Date().toLocaleDateString(),
        score: 0,
        questionsAnswered: 0,
        tasks: [0, 0, 0], // indicates: [0] = beginnerTasks, [1] = intTasks, [2] = expTasks
        upvotes: 0,
        hearts: [],
        numOfTasksDone: 0,
        upvoteData: {
          date: new Date().toDateString(),
          numOfUpvotesToday: 0,
        },
        avatar_url,
      });

    return {
      msg: 'successful',
    };
  } catch (err) {
    console.log(err);
    return {
      errorMsg: 'Server Error: Failed to create account.',
      status: 500,
    };
  }
};

// GET: /auth/user
// ACCESS: private
router.get('/user', checkConnectivity, auth, async (req, res) => {
  const { id: userId } = req.user;

  // use the id to get the signed in user from token
  try {
    const userData = await db.collection('users').doc(`${userId}`).get();

    res.json({
      signedInUser: userData.data(),
    });
  } catch (err) {
    res.status(500).json({
      errorMsg: 'Server error: Failed to fetch your data.',
      error: err,
    });
  }
});

module.exports = router;
