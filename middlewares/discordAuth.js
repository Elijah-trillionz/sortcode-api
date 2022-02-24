const axios = require('axios');

function discordAuth(req, res, next) {
  const token = req.header('discord-token');

  // check for token
  if (!token)
    return res.status(401).json({ errorMsg: 'No token, authorization denied' });
  verifyDiscordAuth(token)
    .then((user) => {
      if (user.errorMsg) {
        return res
          .status(401)
          .json({ errorMsg: 'No token, authorization denied' });
      }

      req.user = user;
      next();
    })
    .catch((err) => {
      res.status(401).json({
        errorMsg: 'Failed to validate token. Please try logging in again',
      });
    });
}

const verifyDiscordAuth = async (access_token) => {
  try {
    const res = await axios.get(`https://discord.com/api/v8/users/@me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!res.data.username) {
      return {
        errorMsg: 'Invalid token, authentication failed',
      };
    }
    const { username, id, avatar } = res.data;

    return {
      fullname: username,
      id,
      username,
      avatar_url: `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`,
    };
  } catch (err) {
    return {
      errorMsg: 'Server error',
    };
  }
};

module.exports = discordAuth;
