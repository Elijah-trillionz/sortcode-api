// 2nd level of checking connectivity
const axios = require('axios').default;

async function checkConnectivity(req, res, next) {
  try {
    const response = await axios.get('https://google.com');

    if (response.status !== 200)
      throw "Unable to establish a connection, seems like you're offline";

    next();
  } catch (err) {
    return res.status(501).json({
      err,
      errorMsg: "Unable to establish a connection, seems like you're offline",
    });
  }
}

module.exports = checkConnectivity;
