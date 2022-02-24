const githubAuth = require('./githuAuth');
const discordAuth = require('./discordAuth');

function auth(req, res, next) {
  const discordToken = req.header('discord-token');

  if (discordToken) {
    return discordAuth(req, res, next);
  }

  return githubAuth(req, res, next);
}

module.exports = auth;
