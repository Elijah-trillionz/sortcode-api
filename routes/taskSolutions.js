const express = require('express');
const db = require('../config/firebase');
const { firestore } = require('firebase-admin');
const uuid = require('uuid');
const auth = require('../middlewares/auth');
const checkConnectivity = require('../middlewares/checkConnectivity');
const router = express.Router();

// POST: /task-solutions
// DESC: get all task solutions
// ACCESS: private
router.get('/:language', checkConnectivity, auth, async (req, res) => {
  const { language } = req.params;
  const formattedLanguage = language === 'csharp' ? 'c#' : language;
  try {
    const allTasks = [];

    if (formattedLanguage !== 'all') {
      const taskSolutionsRef = await db
        .collection('taskSolutions')
        .where('language', '==', formattedLanguage)
        .get();

      if (taskSolutionsRef.empty) {
        res.status(400).json({
          errorMsg: `There are no solutions for task in ${formattedLanguage} language yet`,
        });
        return;
      }

      taskSolutionsRef.forEach((taskSolution) => {
        allTasks.push(taskSolution.data());
      });
    } else {
      const taskSolutionsRef = await db.collection('taskSolutions').get();
      taskSolutionsRef.forEach((taskSolution) => {
        allTasks.push(taskSolution.data());
      });
    }

    res.json({
      taskSolutions: allTasks,
    });
  } catch (err) {
    res.status(500).json({
      errorMsg: 'Server Error: Failed to load task solutions',
      error: err,
    });
  }
});

// POST: /new
// DESC: create a new solution
// ACCESS: private
async function newSolution(req, res) {
  const { username, id: userId } = req.user;

  const { code, taskId, language } = req.body;

  if (code && taskId) {
    const taskSolutionsRef = db.collection('taskSolutions').doc();
    try {
      await taskSolutionsRef.set({
        id: uuid.v4(),
        taskId,
        userId: userId.toString(),
        username,
        code,
        upvotes: 0,
        language,
        createdAt: firestore.Timestamp.fromDate(new Date()),
      });

      const userUpdateResponse = await setUserTasksToDone(userId);
      if (userUpdateResponse.err) {
        return res.status(500).json({
          errorMsg: 'Server Error: Failed to add task solution.',
        });
      }

      return res.json({
        msg: 'Successful',
      });
    } catch (err) {
      res.status(500).json({
        errorMsg: 'Server Error: Failed to add task solution.',
        error: err,
      });
    }
  }
}

// POST: /new
// DESC: update or make new task-solutions
// ACCESS: private
router.post('/new', checkConnectivity, auth, async (req, res) => {
  let taskSolutionDocId;
  const { id: userId } = req.user;

  // TODO: change location of token from localstorage to cookies

  // the code
  const { code, taskId, language } = req.body;

  if (!code || !taskId) {
    res.json({
      errorMsg: 'There has been an error',
    });
  }

  try {
    const existingTaskSolutionsRef = await db
      .collection('taskSolutions')
      .where('taskId', '==', taskId)
      .get();

    if (existingTaskSolutionsRef.empty) {
      newSolution(req, res);
      return;
    }

    let isNewSolution = false;

    existingTaskSolutionsRef.forEach((existingTaskSolutionRef) => {
      if (userId.toString() === existingTaskSolutionRef.data().userId) {
        taskSolutionDocId = existingTaskSolutionRef.id; // update it
      } else {
        isNewSolution = true;
        return;
      }
    });

    if (isNewSolution && !taskSolutionDocId) {
      newSolution(req, res);
      return;
    }
  } catch (err) {
    res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }

  if (code && taskSolutionDocId) {
    const taskSolutionsRef = db
      .collection('taskSolutions')
      .doc(taskSolutionDocId);
    try {
      await taskSolutionsRef.update({
        code,
        language,
      });

      res.json({
        msg: 'Updated',
      });
    } catch (err) {
      res.status(500).json({
        errorMsg: 'Server Error: Unable to update task solution',
        error: err,
      });
    }
  }
});

async function setUserTasksToDone(id) {
  try {
    await db
      .collection('users')
      .doc(`${id}`)
      .update({
        numOfTasksDone: firestore.FieldValue.increment(1),
      });
    return {
      msg: 'done',
    };
  } catch (err) {
    return {
      err,
    };
  }
}

// TODO: enable deleting task solutions after posting

module.exports = router;
