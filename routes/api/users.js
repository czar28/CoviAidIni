const express = require('express');
const { validationResult, check } = require('express-validator');
const router = express.Router();
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../../middleware/auth');
const Resource = require('../../models/Resource');
var request = require('request');

//Register a new User in Database

//@route POST api/users/
// @desc Register New User Route
//@access public

router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please Enter a valid email address').isEmail(),
    check('password', 'Please Enter a password of minimum 6 length').isLength({
      min: 6,
    }),
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
      const { name, email, password } = req.body;

      //see if user already exists
      let user = await User.findOne({ email });

      if (user)
        return res
          .status(400)
          .json({ errors: [{ msg: 'User Already Exists' }] });

      //get gravatar

      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      user = new User({
        name,
        email,
        password,
        avatar,
      });

      //Encrypt password

      //salt to hash (seed) password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      // return jsebtoken

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

//@route GET api/users/
// @desc Login User Route
//@access public

// router.get(
//   '/',
//   [
//     check('email', 'Please Enter a valid email address').isEmail(),
//     check('password', 'Please Enter a password of minimum 6 length')
//       .not()
//       .isEmpty(),
//   ],
//   async (req, res) => {
//     const errorsValidation = validationResult(req);
//     if (!errorsValidation.isEmpty()) {
//       return res.status(400).json({ errors: errorsValidation.array() });
//     }

//     try {
//       const { email, password } = req.body;

//       //see if user already exists
//       let user = await User.findOne({ email });

//       if (!user) {
//         return res
//           .status(400)
//           .json({ errors: [{ msg: 'Invalid credentials' }] });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res
//           .status(400)
//           .json({ errors: [{ msg: 'Invalid credentials' }] });
//       }
//       //Return jswebtoken

//       const payload = {
//         user: {
//           id: user.id,
//           email: user.email,
//         },
//       };

//       jwt.sign(
//         payload,
//         config.get('jwtSecret'),
//         { expiresIn: 360000 },
//         (err, token) => {
//           if (err) throw err;
//           return res.json(token);
//         }
//       );
//     } catch (error) {
//       res.status(500).send('Internal Server Erorr');
//       console.log(error);
//     }
//   }
// );

//@route POST api/users/resource
// @desc add new Resource from a user
//@access public
router.post(
  '/resource',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('qtty', 'Quantity is required').not().isEmpty(),
      check('pincode', 'Pincode is required').not().isEmpty(),
      check('phone', 'Phone Number is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, qtty, pincode, phone } = req.body;
    var url = `https://api.postalpincode.in/pincode/${pincode}`;

    let poss = 1;
    let city, state, country;

    await request.get(
      {
        url: url,
        json: true,
        headers: { 'User-Agent': 'request' },
      },
      async (err, res1, data1) => {
        if (err) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Incorrect Pincode' }] });
        } else if (res1.statusCode !== 200) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Incorrect Pincode' }] });
        } else {
          // data is already parsed as JSON:
          if (data1[0].Status !== 'Success')
            return res
              .status(400)
              .json({ errors: [{ msg: 'Incorrect Pincode' }] });
          else {
            city = data1[0].PostOffice[0].District;
            state = data1[0].PostOffice[0].State;
            country = data1[0].PostOffice[0].Country;

            try {
              // Build a Resource Object
              console.log(poss);
              resource = new Resource({
                name,
                qtty,
                pincode,
                city,
                state,
                country,
                phone,
              });
              resource.user = req.user.id;
              await resource.save();
              const allResources = await Resource.find({ user: req.user.id });
              res.json(allResources);
            } catch (error) {
              console.log(error.message);
              res.status(500).send('Internal Server Error');
            }
          }
        }
      }
    );
  }
);

//@route PUT api/users/resource
// @desc update Resource from a user
//@access public
router.put(
  '/resource/:resource_id',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('qtty', 'Quantity is required').not().isEmpty(),
      check('pincode', 'Pincode is required').not().isEmpty(),
      check('phone', 'Pincode is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, qtty, pincode, phone } = req.body;
    var url = `https://api.postalpincode.in/pincode/${pincode}`;

    let poss = 1;
    let city, state, country;

    await request.get(
      {
        url: url,
        json: true,
        headers: { 'User-Agent': 'request' },
      },
      async (err, res1, data1) => {
        if (err) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Incorrect Pincode' }] });
        } else if (res1.statusCode !== 200) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Incorrect Pincode' }] });
        } else {
          // data is already parsed as JSON:
          if (data1[0].Status !== 'Success')
            return res
              .status(400)
              .json({ errors: [{ msg: 'Incorrect Pincode' }] });
          else {
            city = data1[0].PostOffice[0].District;
            state = data1[0].PostOffice[0].State;
            country = data1[0].PostOffice[0].Country;

            try {
              const reqResource = await Resource.findByIdAndUpdate(
                req.params.resource_id,
                {
                  name: name,
                  qtty: qtty,
                  pincode: pincode,
                  city: city,
                  state: state,
                  country: country,
                  phone: phone,
                }
              );

              //check whether the reource is there or not
              if (!reqResource)
                res.status(404).json({ msg: 'No such resource exists' });

              if (reqResource.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'User not Authorised' });
              }

              await reqResource.save();
              const allResources = await Resource.find({ user: req.user.id });
              res.json(allResources);
            } catch (error) {
              console.log(error.message);
              if (error.kind === 'ObjectId')
                res.status(400).json({ msg: 'Resource not Found' });
              res.status(500).send('Internal Server error');
            }

            console.log(city, state, country);
          }
        }
      }
    );
  }
);

//@route DELETE /api/users/:resource_id
// @desc delete a certain resource of the user
//@access Private
router.delete('/:resource_id', auth, async (req, res) => {
  try {
    const reqResource = await Resource.findById(req.params.resource_id);

    //check whether the reource is there or not
    if (!reqResource) res.status(404).json({ msg: 'No such resource exists' });

    if (reqResource.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not Authorised' });
    }
    await reqResource.delete();
    const allResources = await Resource.find({ user: req.user.id });
    res.json(allResources);
  } catch (error) {
    console.log(error.message);
    if (error.kind === 'ObjectId')
      res.status(400).json({ msg: 'Resource not Found' });
    res.status(500).send('Internal Server error');
  }
});

module.exports = router;
