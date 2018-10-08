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
      return (!(user.hasOwnProperty('tour')) || user.tour === 'null');
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
    const user = Object.values(userSnapshot.val());
    if (req.authUser.status === 'admin' && (!user.hasOwnProperty('tour') || (user.hasOwnProperty('tour') && user.tour === 'null'))){
      res.json(user);
    } else {
      console.log('Is admin')
      console.log(req.authUser.status === 'admin')
      console.log('Does not have tour property')
      console.log(!user.hasOwnProperty('tour'))
      console.log('Already has tour')
      console.log(user.hasOwnProperty('tour') && user.tour === 'null')
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
    let {email, lat, lng, name, status, tour, visible} = req.body;

    const user = {email, lat, lng, name};
    if (tour) user.tour = tour;
    if (visible === undefined) visible = true;
    user.visible = visible;

    if (!status) status = 'member';
    user.status = status;

    const userCreated = await db.ref('/users').push(user);

    // return the created user's key to the client
    res.json({key: userCreated.key});
  } catch (err){
    next(err);
  }
});

// PUT /users/:userId
router.put('/:userId', async(req, res, next) => {
  try {
    const authUser = req.authUser;
    // make sure the logged-in user is an admin.
    if (authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    const userId = req.params.userId;
    const {email, lat, lng, name, status, tour, visible} = req.body;

    const user = {};
    if(email) user.email = email;
    if(lat) user.lat = lat;
    if(lng) user.lng = lng;
    if(name) user.name = name;
    if(status) user.status = status;
    if(tour) user.tour = tour;
    if(visible !== undefined) user.visible = visible;

    const update = await db.ref(`/users/${userId}`).update(user);
    console.log('User profile updated')
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
