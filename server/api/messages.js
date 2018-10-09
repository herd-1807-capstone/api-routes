const { db } = require('./firebaseadmin');
const firebase = require('firebase');
const router = require('express').Router();
module.exports = router;

// POST /api/chat/:userId
router.post('/:userId', async (req, res, next) => {
  try {
    // const fromId = req.authUser;
    const { text, tourId, fromId } = req.body;
    const toId = req.params.userId;
    const conversationRef = [fromId + '_' + toId, toId + '_' + fromId];
    const conversationObj = await db
      .ref(`/users/${fromId}/conversations`)
      .orderByValue()
      .equalTo(conversationRef[0] || conversationRef[1]);
    const timestamp = firebase.database.ServerValue.TIMESTAMP;
    const newMessage = {
      fromId,
      toId,
      text,
      timestamp,
    };
    const updates = {};

    if (conversationObj.length < 1) {
      const newMessageKey = db
        .ref(`/users/${fromId}`)
        .child('conversation')
        .push().key;
      updates[`/users/${fromId}/conversations/${newMessageKey}`] =
        conversationRef[0];
      updates[`/users/${toId}/conversations/${newMessageKey}`] =
        conversationRef[0];
      updates[`/tours/${tourId}/conversations/${newMessageKey}`] = newMessage;
    } else {
      updates[
        `/tours/${tourId}/conversations/${conversationObj.key}`
      ] = newMessage;
    }

    await db.ref().update(updates);

    res.status(201);
  } catch (error) {
    next(error);
  }
});
