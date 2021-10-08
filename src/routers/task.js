const express = require("express");
require("../db/mongoose");
const Task = require("../models/task");
const router = new express.Router();
const auth = require("../middleware/auth");

// GET TASKS
router.get("/tasks", auth, async (req, res) => {
    const { completed, skip, limit, sortBy } = req.query;
    const match = {};
    const sort = {};

    if (sortBy) {
        const sortByArr = sortBy.split(":");
        const attributeToSortBy = sortByArr[0];
        const order = sortByArr[1] === "asc" ? 1 : -1;
        sort[attributeToSortBy] = order;
    }

    if (completed) match.completed = completed === "true";

    try {
        await req.user
            .populate({
                path: "tasks",
                match,
                options: {
                    limit,
                    skip: Number(skip),
                    sort,
                },
            })
            .execPopulate();
        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send(e);
    }
});

// GET TASK
router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) return res.status(404).send();
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

// CREATE TASK
router.post("/tasks", auth, async (req, res) => {
    const task = new Task({ ...req.body, owner: req.user._id });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

// UPDATE TASK
router.patch("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;

    const updatesObject = req.body;
    const updatesArray = Object.keys(updatesObject);
    const allowedUpdates = ["describtion", "completed"];
    const isValidUpdate = updatesArray.every((update) =>
        allowedUpdates.includes(update)
    );
    if (!isValidUpdate)
        return res.status(400).send({ error: "Invalid updates." });

    try {
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) return res.status(404).send();

        updatesArray.forEach(
            (update) => (task[update] = updatesObject[update])
        );
        await task.save();
        res.send(task);
    } catch (e) {
        res.status(400).send();
    }
});

// DELETE TASK
router.delete("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        task = await Task.findOneAndDelete({ _id, owner: req.user._id });
        if (!task) return res.status(404).send();

        res.send(task);
    } catch (e) {
        return res.status(400).send();
    }
});

module.exports = router;
