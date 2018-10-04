const {admin, db} = require('./firebaseadmin');
const router = require('express').Router();
module.exports = router;

// a middleware authenticating a logged-in user and adding that user instance to the request.
router.use(async (req, res, next) => {
  try{
    const {access_token} = req.query;
    if(!access_token){
      const error = new Error('Forbidden');
      error.status = 403;
      next(error);
      return;
    }
    const decodedToken = await admin.auth().verifyIdToken(access_token);
    if(!decodedToken){
      const error = new Error('Forbidden');
      error.status = 403;
      next(error);
      return;
    }
    const authUserSnapshot = await db.ref(`/users/${decodedToken.uid}`).once('value');
    const authUser = authUserSnapshot.val();
    // a user must be logged-in to retrieve data.
    if(!authUser){
      const error = new Error('Auth User Not Found in DB');
      error.status = 403;
      next(error);
      return;
    }
    req.authUser = authUser;
    next();
  }catch(err){
    next(err);
  }
});

router.use('/tours', require('./tours'));
router.use('/users', require('./users'));
router.use('/chat', require('./messages'));

router.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});
