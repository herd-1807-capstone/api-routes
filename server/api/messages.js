const { db } = require('./firebaseadmin');
const router = require('express').Router();
module.exports = router;

const transformObjWithNames = (obj, str1, str2, name1, name2) => {
  const list = Object.keys(obj);
  const newArray = list.map(item => {
    const { fromId, toId } = obj[item];
    const fromName = fromId === str1 ? name1 : name2;
    const toName = toId === str1 ? name1 : name2;
    return { key: item, ...obj[item], fromName, toName };
  });
  return newArray.filter(
    item =>
      (item.fromId === str1 && item.toId === str2) ||
      (item.fromId === str2 && item.toId === str1)
  );
};

const transformObj = (obj, str1, str2) => {
  const list = Object.keys(obj);
  const newArray = list.map(item => {
    return { key: item, ...obj[item] };
  });
  return newArray.filter(
    item =>
      (item.fromId === str1 && item.toId === str2) ||
      (item.fromId === str2 && item.toId === str1)
  );
};

// POST /api/chat/:userId
router.post('/:userId', async (req, res, next) => {
  try {
    const fromId = req.authUser;
    const { toId, text } = req.body;
    const newMessage = { fromId, text, toId };
    const newKey = await db
      .ref('/tours/disney_tour')
      .child(`messages`)
      .push().key;

    const message = {};
    message[`${newKey}`] = newMessage;
    await db.ref('/tours/disney_tour/messages/').update(message);

    const snapshot = await db.ref(`/tours/disney_tour/messages/`).once('value');

    const toUser = await db.ref(`/users/${toId}`).once('value');
    const toName = toUser.val().name;
    const fromUser = await db.ref(`/users/${fromId}`).once('value');
    const fromName = fromUser.val().name;

    const conversation = transformObjWithNames(
      snapshot.val(),
      fromId,
      toId,
      fromName,
      toName
    );

    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
});
