const {db} = require('./firebaseadmin');
const router = require('express').Router();
module.exports = router;

// GET /tours/:tourId
router.get('/:tourId', async(req, res, next) => {
  try{
    const tourId = req.params.tourId;
    const tourSnapshot = await db.ref(`/tours/${tourId}`).once('value');
    const tour = tourSnapshot.val();
    if(!tour){
      res.json({});
      return;
    }
    const users = tour.users;
    // check if current user is either an admin of this tour or a member.
    if(!users || users.indexOf(req.authUser.uid) < 0){
      res.status(403).send('Forbidden');
      return;
    }

    res.json(tour);
  }catch(err){
    next(err);
  }
})

// POST /tours - create a tour without any spots and users.
router.post('/', async(req, res, next) => {
  try{
    const authUser = req.authUser;
    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    const {name, description, imgUrl} = req.body;
    const tour = {
      name,
      guideUId: authUser.uid,
      users: {
        "0": authUser.uid
      },
      description,
      imgUrl, 
    };

    const tourCreated = await db.ref(`/tours/`).push(tour);
    const update = await db.ref(`/users/${authUser.uid}`).update({"tour": tourCreated.key});
    res.json({
      ...tour,
      key: tourCreated.key
    });
  }catch(err){
    next(err);
  }
})

// DELETE /tours/:tourId
router.delete('/:tourId', async(req, res, next) => {
  try{
    // first, check logged-in user's privilege i.e., the guide of this tour(tourId)
    const authUser = req.authUser;
    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    const tourId = req.params.tourId;
    const tourSnapshot = await db.ref(`/tours/${tourId}`).once('value');
    const tour = tourSnapshot.val();
    if(!tour){
      res.status(404).send('Not Found');
      return;
    }

    if(!tour.users || tour.users.indexOf(authUser.uid) < 0){
      res.status(403).send('Forbidden');
      return;
    }

    await db.ref(`/tours/${tourId}`).remove();
    res.status(201).send();
  }catch(err){
    next(err);
  }
})

// PUT /tours/:tourId
router.put('/:tourId', async(req, res, next) => {
  try{
    const authUser = req.authUser;
    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    const {name} = req.body;
    const tourId = req.params.tourId;
    // make sure there is a tour with the given tour id and the currentUser has permission to change the tour.
    const tourSnapshot = await db.ref(`/tours/${tourId}`).once('value');
    const tour = tourSnapshot.val();
    if(!tour){
      res.status(404).send('Tour Not Found');
      return;
    }

    if(!tour.users || !tour.users.indexOf(authUser.uid) < 0){
      res.status(403).send('Forbidden');
      return;
    }

    await db.ref(`/tours/${tourId}`).update({name});
    res.status(201).send();
  }catch(err){
    next(err);
  }
})

// add a new spot to a tour
router.post('/:tourId/spots', async(req, res, next) => {
  try{
    const authUser = req.authUser;
    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    const tourId = req.params.tourId;
    const {description, lat, lng, name} = req.body;
    const spot = {description, lat, lng, name};
    const spotAdded = await db.ref(`/tours/${tourId}/spots`).push(spot);

    res.json({key: spotAdded.key});
  }catch(err){
    next(err);
  }
});

// update spot details of a tour
router.put('/:tourId/spots/:spotId', async(req, res, next) => {
  try{
    const authUser = req.authUser;
    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    const {tourId, spotId} = req.params;
    const {description, lat, lng, name} = req.body;
    const spot = {description, lat, lng, name};
    await db.ref(`/tours/${tourId}/spots/${spotId}`).update(spot);

    res.status(201).send();
  }catch(err){
    next(err);
  }
});

// delete a spot from a tour
router.delete('/:tourId/spots/:spotId', async(req, res, next) => {
  try{
    const authUser = req.authUser;
    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    const {tourId, spotId} = req.params;
    await db.ref(`/tours/${tourId}/spots/${spotId}`).remove();
    res.status(201).send();
  }catch(err){
    next(err);
  }
});

// add a new member i.e., userId to a tour
router.post('/:tourId/users/', async(req, res, next) => {
  try{
    const authUser = req.authUser;

    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    // First, get the list of userIds of a tour
    const {userId} = req.body;
    const { tourId } = req.params;
    const tourSnapshot = await db.ref(`/tours/${tourId}`).once('value');
    const tour = tourSnapshot.val();
    const users = Array.isArray(tour.users) ? tour.users : Object.values(tour.users);

    // check if current user is either an admin of this tour or a member.
    if(!users || users.indexOf(authUser.uid) < 0){
      res.status(403).send('Forbidden');
      return;
    }

    // update the users list, then update
    users.push(userId);

    await db.ref(`/tours/${tourId}`).update({users});
    res.status(201).send();
  }catch(err){
    next(err);
  }
});

// delete a user id from a tour
router.delete('/:tourId/users/:userId', async(req, res, next) => {
  try{
    const authUser = req.authUser;
    if(authUser.status !== 'admin'){
      res.status(403).send('Forbidden');
      return;
    }

    const {tourId, userId} = req.params;
    // First, get the list of userIds of a tour
    const tourSnapshot = await db.ref(`/tours/${tourId}`).once('value');
    const tour = tourSnapshot.val();
    let users = tour.users;
    // check if current user is either an admin of this tour or a member.
    if(!users || users.indexOf(authUser.uid) < 0){
      res.status(403).send('Forbidden');
      return;
    }

    // remove the userId from users
    users = users.filter(user => user !== userId);

    // update the tour with the new list of users.
    await db.ref(`/tours/${tourId}`).update({users});
    res.status(201).send();

  }catch(err){
    next(err);
  }
})

// PUT /tours/:tourId/users/:userId - updates user's location i.e., lat and lng of a User instance in db.
router.put('/:tourId/users/:userId', async (req, res, next) => {
  try{
    const authUser = req.authUser;

    const {tourId, userId} = req.params;
    const {lat, lng} = req.body;
    const tourSnapshot = await db.ref(`/tours/${tourId}`).once('value');
    const tour = tourSnapshot.val();
    if(!tour){
      res.status(404).send('Tour Not Found');
      return;
    }

    if(!tour.users || tour.users.indexOf(authUser.uid) < 0){
      res.status(403).send('Forbidden');
      return;
    }

    const userSnapshot = await db.ref(`/users/${userId}`).once('value');
    const user = userSnapshot.val();
    if(!user){
      res.status(404).send('User Not Found');
      return;
    }

    // update the user with a new pair of lat and lng
    await db.ref(`/users/${userId}`).update({
      lat, lng
    });

    res.status(201).send();
  }catch(err){
    next(err);
  }
});
