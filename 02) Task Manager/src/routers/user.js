const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { welcomeEmail, cancelationEmail } = require('../emails/account');
const router = new express.Router();

// * create user
router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    welcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// * for logging in
router.post('/users/login', async (req, res) => {
  try {
    // 1) use the function to check password (defined in user model)
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    // 2) generate token for specific user
    const token = await user.generateAuthToken();
    // 3) send
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// * for logout
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// * for logging out of everywhere
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.send(500).send();
  }
});

// * read your profile
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

// * update user
router.patch('/users/me', auth, async (req, res) => {
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const updates = Object.keys(req.body);
  const isUpdatePossible = updates.every((item) =>
    allowedUpdates.includes(item)
  );

  if (!isUpdatePossible) {
    return res.status(400).send({ error: `Update isn't valid` });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// * delete user
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    cancelationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (error) {
    res.status(500).send();
  }
});

// -------------/ Setup multer
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image'));
    }
    cb(undefined, true);
  },
});

// * upload profile pic
router.post(
  '/users/me/avatar', // req url
  auth, // authenticate
  upload.single('avatar'), // multer
  async (req, res) => {
    const buffer = await sharp(req.file.buffer) // pass img to buffer
      .resize({ width: 250, height: 250 }) // change size
      .png() // change to png
      .toBuffer(); // switch back to buffer
    req.user.avatar = buffer; // accessing avatar in form of buffer(can only be done if there is not destination)
    await req.user.save(); // save user info to db
    res.send();
  },
  (error, req, res, next) => res.status(400).send({ error: error.message })
);

// * delete profile pic
router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    if (!req.user.avatar) {
      return res.status(404).send('No avatar found');
    }
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

// * fetching the profle pic
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    // set response header
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
