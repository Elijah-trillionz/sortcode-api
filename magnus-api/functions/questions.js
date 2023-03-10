const Questions = require("../models/Questions");
const Users = require("../models/Users");
const bcrypt = require("bcryptjs");

async function getQuestionsFromDB(language, id, password) {
  try {
    const authenticatedError = await authenticateUser(id, password);
    if (authenticatedError.errorMsg) {
      return authenticatedError;
    }

    const languageRef = await Questions.find({ language });

    return {
      questions: languageRef,
    };
  } catch (err) {
    return {
      errorMsg: "There has been a server error",
      errorCode: 500,
    };
  }
}

async function authenticateUser(id, userPassword) {
  try {
    const usersRef = await Users.findOne({ id });
    if (!usersRef) {
      return {
        errorMsg:
          "You are not a registered member, visit our official website to register.",
        errorCode: 404,
      };
    }

    const isMatch = await bcrypt.compare(userPassword, usersRef.password);
    if (!isMatch) {
      return {
        errorMsg: "Password not correct. Not authenticated",
        errorCode: 400,
      };
    }

    return {
      msg: "successful",
    };
  } catch (err) {
    return {
      errorMsg: "There has been a server error",
      errorCode: 500,
    };
  }
}

module.exports = getQuestionsFromDB;
