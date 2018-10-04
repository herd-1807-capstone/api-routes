const {db} = require('./firebaseadmin');
const router = require('express').Router()
module.exports = router;


router.get('/free', async(req, res, next) => {
  try{
    db.ref(`/users/`).once('value')
    .then(usersSnapshot => {
      const users = Object.values(usersSnapshot.val());
      if (req.authUser.status === 'admin'){
        // console.log(users)
        let selectedUser = users.filter((user)=>{
          if (!(user.hasOwnProperty('tour')) || user.tour === 'null'){
            return true
          } else {
            return false
          }
        })
        res.json(selectedUser);
      }else{
        res.status(403).send('Forbidden');
        return;
      }
    })
    .catch(err => {
      next(err);
    })
  }catch(err){
    next(err);
  }
});





// GET /users/:userId
router.get('/:userId', async(req, res, next) => {
  try{
    const userId = req.params.userId;
    db.ref(`/users/${userId}`).once('value')
    .then(userSnapshot => {
      const user = userSnapshot.val();

      if(req.authUser.status === 'admin' || user.uid === userId){
        res.json(user);
      }else{
        res.status(403).send('Forbidden');
        return;
      }
    })
    .catch(err => {
      next(err);
    })
  }catch(err){
    next(err);
  }
});

router.get('/', async(req, res, next) => {
  try{
    let currentUser = req.authUser
    db.ref(`/users/`)
      .orderByChild('tour')
      .equalTo(currentUser.tour)
      .once('value')
      .then(usersSnapshot => {
        const users = Object.values(usersSnapshot.val());
        if (req.authUser.status === 'admin'){
          // console.log(users)
          // let selectedUser = users.filter((user)=>{
          //   if (!(user.hasOwnProperty('tour'))){
          //     return true
          //   } else if (user.tour === currentUser.tour || user.tour === 'null'){
          //     return true
          //   } else {
          //     return false
          //   }
          // })
          res.json(users);
    }else{
      res.status(403).send('Forbidden');
      return;
    }
  })
  .catch(err => {
    next(err);
  })
  }catch(err){
    next(err);
  }
});



// POST /users
router.post('/', async(req, res, next) => {
  try{
    const authUser = req.authUser;

    // make sure the logged-in user is an admin.
    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    // parse info from req.body - email, lat, lng, name, status, tour, visible
    let {email, lat, lng, name, status, tour, visible} = req.body;

    const user = {email, lat, lng, name};
    if(tour) user.tour = tour;
    if(visible === undefined) visible = true;
    user.visible = visible;

    if(!status) status = "member";
    user.status = status;

    const userCreated = await db.ref('/users').push(user);

    // return the created user's key to the client
    res.json({key: userCreated.key});
  }catch(err){
    next(err);
  }
});

// PUT /users/:userId
router.put('/:userId', async(req, res, next) => {
  try{
    const authUser = req.authUser;

    // make sure the logged-in user is an admin.
    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    const userId = req.params.userId;
    const {email, lat, lng, name, status, tour, visibie} = req.body;

    const user = {};
    if(email) user.email = email;
    if(lat) user.lat = lat;
    if(lng) user.lng = lng;
    if(name) user.name = name;
    if(status) user.status = status;
    if(tour) user.tour = tour;
    if(visible !== undefined) user.visible = visible;

    const update = await db.ref(`/users/${userId}`).update(user);

    res.status(201);
  }catch(err){
    next(err);
  }
});

// DELETE /users/:userId
router.delete('/:userId', async(req, res, next) => {
  try{
    const userId = req.params.userId;

    const authUser = req.authUser;
    // make sure the logged-in user is an admin.
    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    await db.ref(`/users/${userId}`).remove();
    res.status(201);
  }catch(err){
    next(err);
  }
});
