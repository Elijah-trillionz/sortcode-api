const Tasks = require('../models/Tasks');

async function getTasksFromDB() {
  try {
    const approvedTasks = await Tasks.find({ status: 'approved' });

    return {
      tasks: approvedTasks,
    };
  } catch (err) {
    return {
      errorMsg: 'There has been a server error',
      errorCode: 500,
    };
  }
}

module.exports = getTasksFromDB;
