const mongoose = require("mongoose");
const validator = require("validator");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            lowerCase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error("Not a valid Email.");
                }
            },
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minLength: 7,
            validate(value) {
                if (value.includes("password")) {
                    throw new Error("Passowrd not valid");
                }
            },
        },
        age: {
            type: Number,
            default: 5,
        },
        tokens: [
            {
                token: {
                    type: String,
                },
            },
        ],
        avatar: {
            type: Buffer,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.virtual("tasks", {
    ref: "Task",
    localField: "_id",
    foreignField: "owner",
});

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
};

userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token = jwt.sign(
        { _id: user._id.toString() },
        process.env.JWT_SECRET
    );
    user.tokens = user.tokens.concat({ token });

    await user.save();
    return token;
};

// Add find by credentials
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user) throw new Error("Unable to login.");

    const isMatch = await bycrypt.compare(password, user.password);

    if (!isMatch) throw new Error("Unable to login");

    return user;
};

// Hash password string before saving
userSchema.pre("save", async function (next) {
    const user = this;

    if (user.isModified("password")) {
        user.password = await bycrypt.hash(user.password, 8);
    }

    next();
});

userSchema.pre("remove", async function (next) {
    const user = this;

    await Task.deleteMany({ owner: user._id });
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
