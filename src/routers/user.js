require("../db/mongoose");
const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const { sendWelcomeMessage, sendByeMessage } = require("../emails/account");

const router = new express.Router();

// CREATE USER
router.post("/users", async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();

        await sendWelcomeMessage(user);

        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
});

// READ PROFILE
router.get("/users/me", auth, async (req, res) => {
    res.send(req.user);
});

// UPDATE USER
router.patch("/users/me", auth, async (req, res) => {
    const updatesObject = req.body;
    const updatesArray = Object.keys(updatesObject);
    const allowedUpdates = ["name", "email", "password", "age"];
    const isValidUpdate = updatesArray.every((update) =>
        allowedUpdates.includes(update)
    );

    if (!isValidUpdate) res.status(400).send({ error: "Invalid updates." });

    try {
        updatesArray.forEach(
            (update) => (req.user[update] = updatesObject[update])
        );
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(400).send();
    }
});

// DELETE USER
router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.remove();
        sendByeMessage(req.user);
        res.send(req.user);
    } catch (e) {
        res.status(400).send();
    }
});

// LOGIN USER
router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(
            req.body.email,
            req.body.password
        );

        const token = await user.generateAuthToken();

        res.send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
});

// LOGOUT USER
router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(
            (token) => token.token !== req.token
        );

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

// LOGOUT USER FROM ALL TOKENS
router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

// UPLOAD PROFILE AVATAR IMAGE
const upload = multer({
    limits: { fileSize: 1000000 },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)\b/)) {
            cb(new Error("Please submit a valid image."));
        }

        req.file = file.buffer;
        cb(null, true);
    },
});
router.post(
    "/users/me/avatar",
    auth,
    upload.single("avatar"),
    async (req, res) => {
        const buffer = await sharp(req.file.buffer)
            .png()
            .resize(250, 250)
            .toBuffer();

        req.user.avatar = buffer;
        await req.user.save();
        res.send(req.user);
    },
    (error, req, res, next) => {
        res.status(400).send({ error: error.message });
    }
);

// DELETE PROFILE AVATAR IMAGE
router.delete("/users/me/avatar", auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(400).send(e);
    }
});

router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) throw new Error({ error: "HII" });

        res.set("Content-Type", "image/png");
        res.send(user.avatar);
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router;
