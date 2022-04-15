const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const Task = require('./Task');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: [true, 'Name must be unique'],
        trim: true,
        default: 'ABC',
        validate(val) {
            if (val == 'Darshit') {
                throw new Error('Invalid Name..');
            }
        },
    },
    age: Number,
    password: {
        type: String
    },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
    image: {
        type: Buffer
    }
}, { timestamps: true });


// Login Validation
employeeSchema.statics.findByCredentials = async (name, password) => {
    const user = await Employee.findOne({ name });

    if (!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return user;
}

// Add Virtual Column When Use Foreign Key
employeeSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'employeeId'
})


// Generate AuthToken And Save Methods
employeeSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, 'GCBVMNVMBKJSECRETKEY');

    user.tokens = user.tokens.concat({ token: token });
    await user.save();

    return token;
}

// Get Necessary Parameter
employeeSchema.methods.getPublicProfile = async function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
}

// Middleware Before Saving Data To Hash Password
employeeSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

// Middleware Delete All Data When User Is Delete
employeeSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ employeeId: user._id });
    next();
});



const Employee = mongoose.model('Employee', employeeSchema, 'Employee');

module.exports = Employee;