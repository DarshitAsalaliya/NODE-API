const express = require('express');
const router = new express.Router();

// Auth
const auth = require('../middleware/auth');

// Model
const TaskModel = require('../models/Task');

// API
router.post('/newtask', auth, async (req, res) => {
    try {
        const newTask = new TaskModel({
            ...req.body,
            employeeId: req.user._id
        });

        await newTask.save();
        res.status(201).send(newTask);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Find Data Using UserId As Well As Task ID To Update And Delete Operation

module.exports = router;