const axios = require('axios');

function githubAuth(req, res, next) {
  const token = req.header('github-token');

  // check for token
  if (!token)
    return res.status(401).json({ errorMsg: 'No token, authorization denied' });
  axios.default
    .get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
      },
    })
    .then((user) => {
      if (!user.data.login) {
        return res
          .status(401)
          .json({ errorMsg: 'Token is not valid, authorization denied' });
      }

      const { login, avatar_url, name, id } = user.data;

      req.user = {
        username: login,
        avatar_url,
        fullname: name,
        id,
      };
      next();
    })
    .catch((err) => {
      res
        .status(401)
        .json({
          errorMsg: 'Failed to validate token. Please try logging in again',
        });
    });
}

module.exports = githubAuth;
