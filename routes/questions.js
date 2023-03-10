const express = require("express");
const db = require("../config/firebase");
const auth = require("../middlewares/auth");
const { firestore } = require("firebase-admin");
const checkConnectivity = require("../middlewares/checkConnectivity");
const getQuestionsFromDB = require("../magnus-api/functions/questions");
const router = express.Router();

// @mtd      GET /api/questions/lang/:language
// @desc     get the total no of tasks
// @access   private
router.get("/lang/:language", checkConnectivity, auth, async (req, res) => {
  const { language } = req.params;

  try {
    const dbRes = await getQuestionsFromDB(
      language,
      process.env.SORTCODE_API_ID,
      process.env.SORTCODE_API_PASSWORD
    );

    if (dbRes.errorMsg) {
      return res.status(dbRes.errorCode).json({
        errorMsg: dbRes.errorMsg,
      });
    }

    res.json({
      questions: dbRes.questions,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      errorMsg: "Server Error: Try reloading",
      error: err,
    });
  }
});

// @mtd      GET
// @route    /api/questions/index
// @desc     get the current questionNo of user
router.get("/index", checkConnectivity, auth, async (req, res) => {
  const { id } = req.user;

  try {
    const user = await db.collection("users").doc(`${id}`).get();

    res.json({
      questions: user.data().questionsAnswered,
      htmlAnsweredQuestions: user.data().htmlAnsweredQuestions
        ? user.data().htmlAnsweredQuestions
        : 0,
      javascriptAnsweredQuestions: user.data().javascriptAnsweredQuestions
        ? user.data().javascriptAnsweredQuestions
        : 0,
      cssAnsweredQuestions: user.data().cssAnsweredQuestions
        ? user.data().cssAnsweredQuestions
        : 0,
    });
  } catch (err) {
    res.status(500).json({
      errorMsg: "Server Error: Try reloading",
      error: err,
    });
  }
});

// @mtd      GET
// @route    /api/questions/update
// @desc     increment the no of questions answered for user
router.get("/update/:language", checkConnectivity, auth, async (req, res) => {
  const { id } = req.user;

  const { language } = req.params;

  if (!language) {
    res.status(400).json({
      errorMsg: "Unable to get language. Report issue",
    });
    return;
  }

  try {
    const userRef = db.collection("users").doc(`${id}`);

    switch (language) {
      case "html":
        await userRef.update({
          questionsAnswered: firestore.FieldValue.increment(1),
          htmlAnsweredQuestions: firestore.FieldValue.increment(1),
        });
        break;
      case "css":
        await userRef.update({
          questionsAnswered: firestore.FieldValue.increment(1),
          cssAnsweredQuestions: firestore.FieldValue.increment(1),
        });
        break;
      case "javascript":
        await userRef.update({
          questionsAnswered: firestore.FieldValue.increment(1),
          javascriptAnsweredQuestions: firestore.FieldValue.increment(1),
        });
        break;
      default:
        await userRef.update({
          questionsAnswered: firestore.FieldValue.increment(1),
        });
        break;
    }

    const user = await userRef.get();

    res.json({
      msg: "updated successfully",
      javascriptAnsweredQuestions: user.data().javascriptAnsweredQuestions,
      htmlAnsweredQuestions: user.data().htmlAnsweredQuestions,
      cssAnsweredQuestions: user.data().cssAnsweredQuestions,
    });
  } catch (err) {
    res.status(500).json({
      errorMsg: "Server error, unable to make updates",
      error: err,
    });
  }
});

// @mtd      GET
// @route    /api/questions/score
// @desc     get the current total score
router.get("/score", checkConnectivity, auth, async (req, res) => {
  const { id } = req.user;

  try {
    const user = await db.collection("users").doc(`${id}`).get();

    res.json({
      score: user.data().score,
    });
  } catch (err) {
    res.status(500).json({
      errorMsg: "Server Error: Failed to load current score",
      error: err,
    });
  }
});

// @mtd      GET
// @route    /api/questions/score/update
// @desc     increment no of scores by 5
router.get("/score/update", checkConnectivity, auth, async (req, res) => {
  const { id } = req.user;

  try {
    const userRef = db.collection("users").doc(`${id}`);

    await userRef.update({
      score: firestore.FieldValue.increment(5),
    });

    const user = await userRef.get();

    res.json({
      newScore: user.data().score,
    });
  } catch (err) {
    res.status(500).json({
      errorMsg: "Server Error: Failed to increment score.",
      error: err,
    });
  }
});

module.exports = router;
