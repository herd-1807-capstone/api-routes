const { db } = require('./firebaseadmin');
const router = require('express').Router();
module.exports = router;

// POST /api/chat/:userId
router.post('/:userId', async (req, res, next) => {
  try {
    const fromId = req.authUser;
    const { text, tourId } = req.body;
    const toId = req.params.userId;
    const newMessage = { fromId, text, toId };
    const newKey = await db
      .ref(`/tours/${tourId}`)
      .child(`messages`)
      .push().key;

    const message = {};
    message[`${newKey}`] = newMessage;
    await db.ref(`/tours/${tourId}/messages/`).update(message);
    res.status(201);
  } catch (error) {
    next(error);
  }
});
