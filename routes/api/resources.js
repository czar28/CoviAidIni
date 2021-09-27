const express = require('express');
const Resource = require('../../models/Resource');
const auth = require('../../middleware/auth');
const router = express.Router();

//@route GET all available resources
// @desc Test Route
//@access Public
router.get('/', async (req, res) => {
  try {
    const allResources = await Resource.find();
    res.json(allResources);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server error');
  }
});

router.delete('/:resource_id', auth, async (req, res) => {
  try {
    const reqResource = await Resource.findById(req.params.resource_id);

    //check whether the reource is there or not
    if (!reqResource) res.status(404).json({ msg: 'No such resource exists' });

    if (reqResource.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not Authorised' });
    }
    await reqResource.delete();
    return res.json({ msg: 'resource removed' });
  } catch (error) {
    console.log(error.message);
    if (error.kind === 'ObjectId')
      res.status(400).json({ msg: 'Resource not Found' });
    res.status(500).send('Internal Server error');
  }
});

module.exports = router;
