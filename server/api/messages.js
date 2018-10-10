const { db } = require('./firebaseadmin');
const firebase = require('firebase');
const router = require('express').Router();
module.exports = router;

// POST /api/chat/:userId
router.post('/:userId', async (req, res, next) => {
  try {
    // const fromId = req.authUser;
    const { fromId, text, tourId } = req.body;
    const toId = req.params.userId;
    const conversationSnapshot = await db
      .ref(`/users/${fromId}/conversations`)
      .orderByValue()
      .equalTo(toId)
      .once('value');

    const conversationObj = conversationSnapshot.val();

    const timestamp = firebase.database.ServerValue.TIMESTAMP;
    const newMessage = {
      fromId,
      toId,
      text,
      timestamp,
    };
    let conversationKey;
    if (conversationObj) {
      conversationKey = Object.keys(conversationObj)[0];
    } else {
      conversationKey = await db.ref(`/users/${fromId}/conversations`).push()
        .key;
      const updates = {};

      updates[`/users/${fromId}/conversations/${conversationKey}`] = toId;
      updates[`/users/${toId}/conversations/${conversationKey}`] = fromId;
      await db.ref().update(updates);
    }
    await db
      .ref(`/tours/${tourId}/conversations/${conversationKey}`)
      .push(newMessage);

    res.status(201).json({ conversationKey });
  } catch (error) {
    next(error);
  }
});
