const express = require('express');
const db = require('../config/firebase');
const auth = require('../middlewares/auth');
const checkConnectivity = require('../middlewares/checkConnectivity');
const router = express.Router();
const getTasksFromDB = require('../magnus-api/functions/tasks');

// @mtd      GET /api/tasks/
// @desc     get the total no of tasks
// @access   private
router.get('/', checkConnectivity, auth, async (req, res) => {
  try {
    const dbRes = await getTasksFromDB();

    if (dbRes.errorMsg) {
      return res.status(dbRes.errorCode).json({
        errorMsg: dbRes.errorMsg,
      });
    }

    res.json({
      tasks: dbRes.tasks,
    });
  } catch (err) {
    res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }
});

// @mtd      GET
// @route    /api/tasks
// @desc     get the total no of tasks

router.get('/index', checkConnectivity, auth, async (req, res) => {
  const { id } = req.user;

  try {
    const userRef = await db.collection('users').doc(`${id}`).get();

    res.json({
      numOfTasks: userRef.data().tasks,
    });
  } catch (err) {
    res.status(500).json({
      errorMsg: 'Server Error: Try reloading',
      error: err,
    });
  }
});

// @mtd      GET
// @route    /api/tasks/update/:difficultyLvl
// @desc     update no of tasks for user
router.get(
  '/update/:difficultyLvl',
  checkConnectivity,
  auth,
  async (req, res) => {
    const { id } = req.user;
    const { difficultyLvl } = req.params;

    try {
      const userRef = db.collection('users').doc(`${id}`);
      const userDoc = await userRef.get();
      let beginners = userDoc.data().tasks[0];
      let intermediates = userDoc.data().tasks[1];
      let experts = userDoc.data().tasks[2];

      switch (difficultyLvl) {
        case 'beginners':
          await userRef.update({
            tasks: [(beginners += 1), intermediates, experts],
          });
          res.json({
            msg: 'updated successfully',
            tasksSolved: userDoc.data().tasks[0],
          });
          break;
        case 'intermediates':
          await userRef.update({
            tasks: [beginners, (intermediates += 1), experts],
          });
          res.json({
            msg: 'updated successfully',
            tasksSolved: userDoc.data().tasks[1],
          });
          break;
        case 'experts':
          await userRef.update({
            tasks: [beginners, intermediates, (experts += 1)],
          });
          res.json({
            msg: 'updated successfully',
            tasksSolved: userDoc.data().tasks[2],
          });
          break;
        default:
          await userRef.update({
            tasks: [(beginners += 1), intermediates, experts],
          });
          res.json({
            msg: 'updated successfully',
            tasksSolved: userDoc.data().tasks[0],
          });
      }
    } catch (err) {
      res.status(500).json({
        errorMsg: 'Server Error: unable to make updates',
        error: err,
      });
    }
  }
);

module.exports = router;
