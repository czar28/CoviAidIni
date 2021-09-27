const express = require('express');
const Resource = require('../../models/Resource');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
var request = require('request');
const router = express.Router();

//@route GET /api/resources/filterby
// @desc send all available resources Route
//@access Private
router.get(
  '/:filterby',
  [auth, [check('pincode', 'Pincode is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { pincode } = req.body;
    var url = `https://api.postalpincode.in/pincode/${pincode}`;
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
              let reqResource = null;
              if (req.params.filterby === 'city')
                reqResource = await Resource.find({ city: city });

              if (req.params.filterby === 'state')
                reqResource = await Resource.find({ state: state });

              if (req.params.filterby === 'country')
                reqResource = await Resource.find({ country: country });
              return res.json(reqResource);
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

//@route GET /api/resources/city
// @desc send all available resources in a city Route
//@access Public

router.get('/', auth, async (req, res) => {
  try {
    const allResources = await Resource.find();
    res.json(allResources);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server error');
  }
});

module.exports = router;
