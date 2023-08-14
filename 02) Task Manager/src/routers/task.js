const express = require('express');
const Task = require('../models/task');
const router = new express.Router();
const auth = require('../middleware/auth');

// * create tasks
router.post('/tasks', auth, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

// * read all tasks by a user
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=createdAt:asc
router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === 'true'; // checking if true or fasle with `===`
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1] === 'asc' ? 1 : -1;
  }

  try {
    await req.user
      .populate({
        path: 'tasks',
        // for filtering
        match: match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

//*read a specific task of a user
router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    task ? res.send(task) : res.status(404).send();
  } catch (error) {
    res.status(500).send(e);
  }
});

// * update specific task
router.patch('/tasks/:id', auth, async (req, res) => {
  const validUpdates = ['task', 'completed'];
  const updates = Object.keys(req.body);
  const isUpdateValid = updates.every((item) => validUpdates.includes(item));

  if (!isUpdateValid) {
    res.status(400).send({ error: 'Inavlid update' });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

// * delete specific task
router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    task ? res.send(task) : res.status(404).send('Task not found');
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
