function validateUpvotes(req, res, next) {
  const { upvoteData } = req.body;

  const todaysDate = new Date().toDateString();

  if (upvoteData.numOfUpvotesToday >= 4 && todaysDate === upvoteData.date) {
    res.status(403).json({
      errorMsg: 'You have reached maximum number of upvotes per day',
    });
    return;
  }

  next();
}

module.exports = validateUpvotes;
