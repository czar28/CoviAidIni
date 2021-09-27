const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const router = express.Router();
const Blog = require('../../models/Blog');
const config = require('config');

//@route GET api/blogs
// @desc get all informatibe blogs
//@access private

router.get('/', auth, async (req, res) => {
  try {
    const allBlogs = await Blog.find();
    res.send(allBlogs);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server error');
  }
});

//@route GET api/blogs/:blog_id
// @desc get one informatibe blog
//@access private

router.get('/:blog_id', auth, async (req, res) => {
  try {
    const allBlogs = await Blog.findById(req.params.blog_id);
    if (!allBlogs) res.send({ msg: 'No such Blog exists' });
    res.send(allBlogs);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server error');
  }
});

//@route POST api/blogs
// @desc Post informatibe blogs
//@access private{Only To one of the admins  }

router.post(
  '/',
  [
    auth,
    [
      check('image', 'image is required').not().isEmpty(),
      check('text', 'Text is required').not().isEmpty(),
      check('heading', 'heading is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errorsValidation = validationResult(req);
    if (!errorsValidation.isEmpty()) {
      return res.status(400).json({ errors: errorsValidation.array() });
    }
    try {
      if (
        config['admin1'] !== req.user.email &&
        config['admin2'] !== req.user.email
      ) {
        return res.status(401).json({ msg: 'User not Authorised' });
      }

      const { image, text, heading } = req.body;
      blog = new Blog({ image, text, heading });
      await blog.save();
      const allBlogs = await Blog.find();
      res.send(allBlogs);
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server error');
    }
  }
);

//@route DELETE api/blogs/:blog_id
// @desc delete informatibe blogs
//@access private{Only To one of the admins  }
router.delete('/:blog_id', auth, async (req, res) => {
  try {
    if (
      config['admin1'] !== req.user.email &&
      config['admin2'] !== req.user.email
    ) {
      return res.status(401).json({ msg: 'User not Authorised' });
    }

    await Blog.findByIdAndDelete({ _id: req.params.blog_id });
    const allBlogs = await Blog.find();
    res.send(allBlogs);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server error');
  }
});

//@route   put api/blogs/like/:blog_id
//@desc    like a blog by id
//@access  Private
router.put('/like/:blog_id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blog_id);
    if (!blog) {
      res.status(404).json({ msg: 'BLog not found' });
    }
    //check is blog was already liked
    if (
      blog.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Blog already liked' });
    }
    blog.likes.unshift({ user: req.user.id });
    await blog.save();
    return res.json(blog.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
});

//@route   put api/blogs/unlike/:blog_id
//@desc    like a blog by id
//@access  Private
router.put('/unlike/:blog_id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blog_id);
    if (!blog) {
      res.status(404).json({ msg: 'Blog not found' });
    }
    //check is post was already liked
    if (
      blog.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Blog was not liked' });
    }
    // Get remove index
    const removeIndex = blog.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    blog.likes.splice(removeIndex, 1);
    await blog.save();
    return res.json(blog.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
});

//@route   post api/blogs/comment/:blog_id
//@desc    write a comment
//@access  Private
router.post(
  '/comment/:blog_id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const blog = await Blog.findById(req.params.blog_id);
      if (!blog) {
        res.status(404).json({ msg: 'Blog not found' });
      }
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      blog.comments.unshift(newComment);
      await blog.save();
      res.json(blog.comments);
    } catch (error) {
      if (error.kind === 'ObjectId')
        res.status(404).json({ msg: 'Blog not found' });
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  }
);

//@route  delete api/blogs/comment/:blog_id/:comment_id
//@desc    delete a comment
//@access  Private
router.delete('/comment/:blog_id/:comment_id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blog_id);
    if (!blog) {
      res.status(404).json({ msg: 'Blog not found' });
    }

    //pull out comment
    const comment = blog.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // comment exists
    if (!comment)
      return res.status(404).json({ msg: 'Comment does not exist' });

    //Make sure user is same as deleting one
    if (comment.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'User not Authorised' });

    //get remove index
    const removeIndex = blog.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);
    blog.comments.splice(removeIndex, 1);
    await blog.save();
    return res.json(blog.comments);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
