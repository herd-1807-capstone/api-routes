const {db} = require('./firebaseadmin');
const router = require('express').Router();
module.exports = router;

router.get('/', async(req, res, next) => {
  try {
    const toursSnapshot = await db.ref(`/tours`).once('value');
    const tours = toursSnapshot.val();
    res.json(tours);
  } catch (err){
    next(err);
  }
})

// GET /tours/:tourId
router.get('/:tourId', async(req, res, next) => {
  try{
    const tourId = req.params.tourId;
    const tourSnapshot = await db.ref(`/tours/${tourId}`).once('value');
    const tour = tourSnapshot.val();
    if (!tour){
      res.status(404).send('Not Found');
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
    const {name, announcement, users} = req.body;
    const tourId = req.params.tourId;
    // make sure there is a tour with the given tour id and the currentUser has permission to change the tour.
    const tourSnapshot = await db.ref(`/tours/${tourId}`).once('value');
    const tour = tourSnapshot.val();
    if(!tour){
      res.status(404).send('Tour Not Found');
      return;
    }

    const tourUpdated = {}; // just name and/or announcement;
    if(name) tourUpdated.name = name;
    if(announcement) tourUpdated.announcement = announcement;
    if(users) tourUpdated.users = users;

    await db.ref(`/tours/${tourId}`).update(tourUpdated);
    res.status(204).send();
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
    const {description, lat, lng, name, imgUrl} = req.body;
    const spot = {description, lat, lng, name, imgUrl};
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
    const {description, lat, lng, name, imgUrl} = req.body;
    const spot = {description, lat, lng, name, imgUrl};
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
    res.status(201).send('User added to tour');
  }catch(err){
    next(err);
  }
});


// add a member to a tour by link
router.post('/:tourId/invitations/:inviteId', async(req, res, next) => {
  try{
    const authUser = req.authUser;
    const userId = authUser.uid
    const { tourId, inviteId } = req.params;
  // first, get tour info by tourId
    const tourSnapshot = await db.ref(`/tours/${tourId}/`).once('value');
    const tour = tourSnapshot.val();
    if(!tour || !tour.invitations.hasOwnProperty(inviteId)){
      res.status(404).send('Tour not found');
      return;
    }
  // second, check if user email is in invitation list
    if(tour.invitations[inviteId] !== authUser.email){
      res.status(403).send('Forbidden');
      return;
    }

  // third, add userId to tours/tourId/users
    const users = Array.isArray(tour.users) ? tour.users : Object.values(tour.users);
  // update the users list, then update
    users.push(userId);
    await db.ref(`/tours/${tourId}`).update({users});
  // fourth, add tourId to user's profile
    const updateUser = {tour:tourId};
    await db.ref(`/users/${userId}`).update(updateUser);
    res.status(201).send("Welcome to the tour!");
  }catch(err){
    next(err);
  }
});

// create an invitation
router.post('/:tourId/invitation/add', async(req, res, next) => {
  try{
    const authUser = req.authUser;
    const userId = authUser.uid
    const {  inviteeEmail } = req.body
    if(authUser.hasOwnProperty('tour') || authUser.tour === 'null'){
      res.status(403).send('You need to be in a tour group');
      return;
    }
    const tourId = authUser.tour
    // first, find current user tour
    const tourSnapshot = await db.ref(`/tours/${tourId}/`).once('value');
    const tour = tourSnapshot.val();
    if(!tour){
      res.status(404).send('Tour not found');
      return;
    }
    // second, check for invitations by invitee email, prevent duplicate
    if(tour.hasOwnProperty("invitations")){
      let invitee = tour.invitations.filter((invitation)=>{
        if(Object.values(invitation)[0] === inviteeEmail){
          return true
        } else {
          return false
        }
      })
      if(invitee.length > 0){
        res.status(201).send('Invited!')
        return
      }
    }
    // third, add invitee email in invitations list if not exisit
    const createInvite = await db.ref(`/tours/${tourId}/invitations`).push({inviteeEmail});
    // fourth, return invitation key
    res.status(201).json(createInvite)
    return
  }catch(err){
    next(err);
  }
});

//write all user location to tour history
router.post('/:tourId/history', async(req, res, next) => {
  try {
    const authUser = req.authUser;
    const { tourId } = req.params;
    const {locationData} = req.body;
    if(authUser.status !== 'admin' || authUser.tour !== tourId){
      res.status(403).send('Forbidden');//only admin records the history for their current tour
      return;
    }
    const tourRef = db.ref(`/tours/${tourId}`);

    const snap = await tourRef.once('value');
    const tourInfo = snap.val();

    if (Date.now() < tourInfo.startDateTime || Date.now() > tourInfo.endDateTime) return;

    const updated = await tourRef.child('history').update(locationData); //batch update at once
    if (updated) res.sendStatus(201);
  } catch (error) {
    next(error);
  }
})

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
    const {lat, lng, lastSeen} = req.body;
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
      lat, lng, lastSeen
    });

    res.status(201).send();
  }catch(err){
    next(err);
  }
});
