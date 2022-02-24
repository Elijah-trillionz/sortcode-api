const express = require('express');
const db = require('../config/firebase');
const { firestore } = require('firebase-admin');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkConnectivity = require('../middlewares/checkConnectivity');
const validateUpvotes = require('../middlewares/validateUpvotes');

// TODO: get a library or program to monitor network connection

// POST: /upvote
// DESC: update the number of upvotes in a task
// ACCESS: private

router.post('/', checkConnectivity, auth, validateUpvotes, async (req, res) => {
  // send the current upvote on the task from client add one to it and update to db
  const { id: signedInUserId } = req.user;
  const { taskSolutionId } = req.body;

  // extract, new
  const user = await db.collection('users').doc(`${signedInUserId}`).get();
  const heartsByUser = user.data().hearts;
  // check if this task has been upvoted before // unnecessary in server
  if (heartsByUser.indexOf(taskSolutionId) !== -1) {
    res.status(400).json({
      errorMsg: 'You have upvoted this task already. Client Error',
    });
    return;
  }

  if (heartsByUser.length >= 40) {
    res.status(403).json({
      errorMsg: 'You have exceeded the maximum number of upvoted per account.',
    });
  }

  // receiving number of upvotes from client
  const { upvoteData } = req.body;
  const amendedUpvoteData = amendUpvoteData(upvoteData, true);

  try {
    const userDoc = db.collection('users').doc(`${signedInUserId}`);
    await userDoc.update({
      hearts: firestore.FieldValue.arrayUnion(taskSolutionId),
      upvoteData: amendedUpvoteData, // changing upvotes in db
    });
  } catch (err) {
    return res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }

  // extra: get the new upvote data from db
  let databaseUpvoteData;
  try {
    const userDoc = await db.collection('users').doc(`${signedInUserId}`).get();

    databaseUpvoteData = userDoc.data().upvoteData;
  } catch (err) {}

  // secondly: display newUpvote on the task solution
  let taskSolutionDocId, userId, currentUpvote;
  try {
    const taskSolutionsRef = await db
      .collection('taskSolutions')
      .where('id', '==', taskSolutionId)
      .get();

    if (taskSolutionsRef.empty) {
      res.status(500).json({
        errorMsg:
          "Server Error: We can't seem to find your data. Try reloading",
      });
      return;
    }

    taskSolutionsRef.forEach((taskSolutionDoc) => {
      taskSolutionDocId = taskSolutionDoc.id;
      currentUpvote = taskSolutionDoc.data().upvotes;
      userId = taskSolutionDoc.data().userId;
    });
  } catch (err) {
    return res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }

  try {
    const taskSolutionDoc = db
      .collection('taskSolutions')
      .doc(taskSolutionDocId);
    await taskSolutionDoc.update({
      upvotes: currentUpvote + 1,
    });
  } catch (err) {
    return res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }

  // lastly: attribute the new upvotes to the user's upvotes (the user who provided the solution)
  let userDocId, currentUserUpvotes;
  try {
    const usersRef = await db
      .collection('users')
      .where('id', '==', userId)
      .get();

    if (usersRef.empty) {
      res.status(500).json({
        errorMsg: "Server Error: We can't seem to find your data.",
      });
      return;
    }

    usersRef.forEach((userDoc) => {
      userDocId = userDoc.id;
      currentUserUpvotes = userDoc.data().upvotes;
    });
  } catch (err) {
    return res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }

  try {
    const userDoc = db.collection('users').doc(userDocId);
    await userDoc.update({
      upvotes: currentUserUpvotes + 1,
    });

    res.json({
      msg: 'all updated',
      databaseUpvoteData,
    });
  } catch (err) {
    return res.status(500).json({
      errorMsg: 'Server Error: Unable to upvote task',
      error: err,
    });
  }
});

const amendUpvoteData = (upvoteData, increment) => {
  const { numOfUpvotesToday, date } = upvoteData;
  const todaysDate = new Date().toDateString();

  if (upvoteData.date !== todaysDate) {
    return {
      numOfUpvotesToday: 1,
      date: todaysDate,
    };
  }

  return {
    numOfUpvotesToday: increment
      ? numOfUpvotesToday + 1
      : numOfUpvotesToday - 1,
    date,
  };
};

// POST: /upvote/remove
// DESC: update the number of upvotes in a task by removing
// ACCESS: private

router.post('/remove', checkConnectivity, auth, async (req, res) => {
  // send the current upvote on the task from client remove one from it and update to db
  const { id: signedInUserId } = req.user;
  const { taskSolutionId } = req.body;

  const user = await db.collection('users').doc(`${signedInUserId}`).get();
  const heartsByUser = user.data().hearts;

  // check if this solution has been upvoted
  if (heartsByUser.indexOf(taskSolutionId) === -1) {
    res.status(400).json({
      errorMsg: 'This task has not been upvoted by you. Client Error',
    });
    return;
  }

  // receiving number of upvotes from client
  const { upvoteData } = req.body;
  const amendedUpvoteData = amendUpvoteData(upvoteData, false);

  try {
    const userDoc = db.collection('users').doc(`${signedInUserId}`);
    await userDoc.update({
      hearts: firestore.FieldValue.arrayUnion(taskSolutionId),
      upvoteData: amendedUpvoteData, // changing upvotes in db
    });
  } catch (err) {
    return res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }

  // extra: get the new upvote data from db
  let databaseUpvoteData;
  try {
    const userDoc = await db.collection('users').doc(`${signedInUserId}`).get();

    databaseUpvoteData = userDoc.data().upvoteData;
  } catch (err) {}

  try {
    const userDoc = db.collection('users').doc(`${signedInUserId}`);
    await userDoc.update({
      hearts: firestore.FieldValue.arrayRemove(taskSolutionId),
    });
  } catch (err) {
    res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }

  // secondly: display newUpvote on the task solution
  let taskSolutionDocId, userId, currentUpvote;
  try {
    const taskSolutionsRef = await db
      .collection('taskSolutions')
      .where('id', '==', taskSolutionId)
      .get();

    if (taskSolutionsRef.empty) {
      res.status(500).json({
        errorMsg:
          "Server Error: We can't seem to find your data. Try reloading",
      });
      return;
    }

    taskSolutionsRef.forEach((taskSolutionDoc) => {
      taskSolutionDocId = taskSolutionDoc.id;
      currentUpvote = taskSolutionDoc.data().upvotes;
      userId = taskSolutionDoc.data().userId;
    });
  } catch (err) {
    return res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }

  try {
    const taskSolutionDoc = db
      .collection('taskSolutions')
      .doc(taskSolutionDocId);
    await taskSolutionDoc.update({
      upvotes: currentUpvote - 1,
    });
  } catch (err) {
    return res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }

  // thirdly: attribute the new upvotes to the user's upvotes (the user who provided the solution)
  let userDocId, currentUserUpvotes;
  try {
    const usersRef = await db
      .collection('users')
      .where('id', '==', userId)
      .get();

    if (usersRef.empty) {
      res.status(500).json({
        errorMsg:
          "Server Error: We can't seem to find your data. Try reloading",
      });
      return;
    }

    usersRef.forEach((userDoc) => {
      userDocId = userDoc.id;
      currentUserUpvotes = userDoc.data().upvotes;
    });
  } catch (err) {
    return res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }

  try {
    const userDoc = db.collection('users').doc(userDocId);
    await userDoc.update({
      upvotes: currentUserUpvotes - 1,
    });
    res.json({
      msg: 'all updated',
      databaseUpvoteData,
    });
  } catch (err) {
    return res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }
});

module.exports = router;
