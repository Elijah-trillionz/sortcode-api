const express = require('express');
const db = require('../config/firebase');
const router = express.Router();
const checkConnectivity = require('../middlewares/checkConnectivity');
const Benchmark = require('benchmark');

// GET: /users
// ACCESS: public
router.get('/users', checkConnectivity, async (req, res) => {
  try {
    const usersRef = await db.collection('users').get();
    const allUsers = [];

    usersRef.forEach((userDoc) => {
      const {
        id,
        username,
        fullname,
        dateJoined,
        score,
        questionsAnswered,
        tasks,
        upvotes,
        numOfTasksDone,
        avatar_url,
      } = userDoc.data();

      allUsers.push({
        id,
        username,
        fullname,
        dateJoined,
        score,
        questionsAnswered,
        tasks,
        upvotes,
        numOfTasksDone,
        avatar_url,
      });
    });

    res.send(
      allUsers.map((user) => {
        return user;
      })
    );
  } catch (err) {
    res.status(500).json({
      errorMsg: 'Server error: Failed to load all users',
      error: err,
    });
  }
});

// POST: /benchmark
// ACCESS: public
router.post('/benchmark', checkConnectivity, async (req, res) => {
  const suite = new Benchmark.Suite();
  const { code } = req.body;

  suite
    .add('Test Code: ', () => {
      code;
    })
    .on('complete', (e) => {
      res.json({
        result: String(e.target),
      });
    })
    .run({ async: true });
});

// GET: /total
// ACCESS: public
router.post('/total', checkConnectivity, async (req, res) => {
  res.send('hello world');
});

module.exports = router;
