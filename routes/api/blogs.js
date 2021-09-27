const express = require('express');

const router = express.Router();

//@route GET api/Blogs
// @desc Test Route
//@access private
router.get('/', (req, res) => {
  res.send('Blogs Route');
});

module.exports = router;
