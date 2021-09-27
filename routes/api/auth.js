const express = require('express');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const router = express.Router();
const { validationResult, check } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

//GET api/auth
//@desc
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
});

//@route POST api/auth
// @desc Register New User Route
//@access Public

router.post(
  '/',
  [
    check('email', 'Please Enter the email address').isEmail(),
    check('password', 'Please enter password').exists(),
  ],
  async (req, res) => {
    const errorsValidation = validationResult(req);
    if (!errorsValidation.isEmpty()) {
      //bad request 400
      //send json of errors
      //errors is an array of objects[{param,location,msg}]
      return res.status(400).json({ errors: errorsValidation.array() });
    }

    try {
      const { email, password } = req.body;

      //see if user already exists
      let user = await User.findOne({ email });

      if (!user)
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const payload = {
        user: {
          id: user.id,
          email: user.email,
        },
      };
      //edit it to an hour b4 deploying
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      res.status(500).send('Internal Server Erorr');
      console.log(error);
    }
  }
);

module.exports = router;
