const {db} = require('./firebaseadmin');
const router = require('express').Router();
module.exports = router;

// GET /api/chat/:userId ===> MIGRATE TO FRONT END FOR REAL TIME TREATMENT
router.get('/:userId', async (req, res, next) => {
  try {
    // const userAuth = firebase.auth().currentUser;
    // const userId = req.params.userId;
    // if (userId === userAuth) {
    const snapshot = await db.ref(`/tours/disney_tour/messages/`).once('value');
    const messages = snapshot.val();

    if (messages) {
      res.json(messages);
    } else res.status(404).send('Not Found');
    // } else res.status(403).send('forbidden');
  } catch (error) {
    next(error);
  }
});

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
    // const userAuth = firebase.auth().currentUser;
    const fromId = req.params.userId;
    const { toId, text } = req.body;

    // if (fromId === userAuth) {
    const newMessage = { fromId, text, toId };
    const newKey = await db
      .ref('/tours/disney_tour')
      .child(`messages`)
      .push().key;

    const message = {};
    message[`${newKey}`] = newMessage;
    await db.ref('/tours/disney_tour/messages/').update(message);

    const snapshot = await db.ref(`/tours/disney_tour/messages/`).once('value');
    const allMessages = transformObj(snapshot.val(), fromId, toId);

    res.status(201).json(allMessages);

    // } else res.status(403).send('forbidden!');
  } catch (error) {
    next(error);
  }
});
