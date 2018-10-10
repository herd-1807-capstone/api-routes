const {db} = require('./firebaseadmin');
const router = require('express').Router();
module.exports = router;

// GET /users
router.get('/', (req, res, next) => {
  try {
    if (req.authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    let currentUser = req.authUser;
    db.ref(`/users/`)
      .orderByChild('tour')
      .equalTo(currentUser.tour)
      .once('value')
      .then(usersSnapshot => {
        const users = Object.values(usersSnapshot.val());
        res.json(users);
    })
    .catch(err => {
      next(err);
    });
  } catch (err){
    next(err);
  }
});

// GET /users/free
router.get('/free', async (req, res, next) => {
  try {
    if (req.authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return ;
    }

    const usersSnapshot = await db.ref(`/users/`).once('value');
    const users = Object.values(usersSnapshot.val());
    let selectedUser = users.filter((user) => {
      return (!(user.hasOwnProperty('tour')));
    });

    res.json(selectedUser);
  } catch (err){
    next(err);
  }
});

// GET /users/:userId
router.get('/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const userSnapshot = await db.ref(`/users/${userId}`).once('value');
    const user = userSnapshot.val();
    if (req.authUser.status === 'admin' || user.uid === userId){
      res.json(user);
    } else {
      res.status(403).send('Forbidden');
      return;
    }
  } catch (err){
    next(err);
  }
});

// GET /users/email/:email
router.get('/email/:email', async (req, res, next) => {
  try {
    const email = req.params.email;
    const userSnapshot = await db.ref(`/users/`).orderByChild('email').equalTo(email).once('value');
    const [user] = Object.values(userSnapshot.val());
    if (req.authUser.status === 'admin' && (!user.hasOwnProperty('tour'))){
      res.json(user);
    } else {
      res.status(403).send('Forbidden');
      return;
    }
  } catch (err){
    next(err);
  }
});

// POST /users
router.post('/', async(req, res, next) => {
  try {
    const authUser = req.authUser;
    // make sure the logged-in user is an admin.
    if (authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    // parse info from req.body - email, lat, lng, name, status, tour, visible
    let {email, lat, lng, name, tour, status, visible, uid} = req.body;

    const user = {email, lat, lng, name};
    if (tour) user.tour = tour;
    if (visible === undefined) visible = true;
    user.visible = visible;

    if (!status) status = 'member';
    user.status = status;

    if (uid) user.uid = uid

    const userCreated = await db.ref('/users').push(user);
    let newUser = await db.ref(`/users/${user.uid}`).once('value');

    // return the created user's key to the client
    res.json(userCreated.val());
  } catch (err){
    next(err);
  }
});

// PUT /users/:userId
router.put('/:userId', async(req, res, next) => {
  try {
    const userId = req.params.userId;
    const authUser = req.authUser;
    // make sure the logged-in user is an admin.
    if (authUser.status !== 'admin' && authUser.uid !== userId){
      res.status(403).send('Forbidden');
      return;
    }

    const {email, lat, lng, name, status, tour, visible} = req.body;

    const user = {};
    if(email) user.email = email;
    if(lat) user.lat = lat;
    if(lng) user.lng = lng;
    if(name) user.name = name;
    if(status) user.status = status;
    // if tour comes as null, then make user's tour to null.
    // Note if tour comes as undefined, then don't touch user's tour field.
    if(tour === null) {
      user.tour = null;
    }else if(tour !== undefined){
      user.tour = tour;
    }
    if(visible !== undefined) user.visible = visible;
    const update = await db.ref(`/users/${userId}`).update(user);
    res.status(201).json(update);
  }catch(err){
    next(err);
  }
});

// DELETE /users/:userId
router.delete('/:userId', async(req, res, next) => {
  try {
    const authUser = req.authUser;
    // make sure the logged-in user is an admin.
    if (authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    const userId = req.params.userId;
    await db.ref(`/users/${userId}`).remove();
    res.status(201).send();
  } catch (err){
    next(err);
  }
});
