const express = require('express');
const multer = require('multer');

// For Resize Image
const sharp = require('sharp');

const router = new express.Router();

// Multer For Folder Storage
// const upload = multer({
//     dest: 'uploads/',
//     limits: {
//         fileSize: 1000000 // 1 MB
//     },
//     fileFilter(req, file, cb) {

// if(!file.originalname.endsWith('.pdf')){
//     return cb(new Error('Please upload pdf file'));
// }

//         if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
//             return cb(new Error('Please upload pdf or docx file'));
//         }
//         cb(null, true);
//     }
// });

// Multer For Database Storage
const upload = multer({
    limits: {
        fileSize: 1000000 // 1 MB
    },
    fileFilter(req, file, cb) {

        // if(!file.originalname.endsWith('.pdf')){
        //     return cb(new Error('Please upload pdf file'));
        // }

        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload pdf or docx file'));
        }
        cb(null, true);
    }
});

// Auth
const auth = require('../middleware/auth');

// Model
const EmployeeModel = require('../models/Employee');

// API Using Async Await

// Create GenerateToken
router.post('/newuser', async (req, res) => {
    const newEmployee = new EmployeeModel(req.body);
    try {
        await newEmployee.save();
        const token = await newEmployee.generateAuthToken();
        res.status(201).send({ newEmployee, token });
    } catch (err) {
        res.status(400).send(newEmployee);
    }
});

// Upload User Image To Folder
// router.post('/users/profileimage', auth, upload.single('image'), async (req, res) => {
//     res.send();
// }, (error, req, res, next) => {
//     res.status(400).send({ error: error.message });
// });

// Upload User Image To Database
router.post('/users/profileimage', auth, upload.single('image'), async (req, res) => {
    
    // Crop & Resize Image
    //const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer();
    
    // Manage Quality
    const buffer = await sharp(req.file.buffer).png({quality:50}).toBuffer();

    //req.user.image = req.file.buffer;
    req.user.image = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

// Get User Image From Database
router.get('/users/:id/profileimage', async (req, res) => {
    try {
        const user = await EmployeeModel.findById(req.params.id);

        if (!user || !user.image) {
            throw new Error();
        }
        res.set('Content-Type', 'image/jpg');
        res.send(user.image);
    } catch (e) {
        res.status(404).send(e);
    }
});

// Delete User Image From Database
router.delete('/users/profileimage', auth, async (req, res) => {
    req.user.image = undefined;
    await req.user.save();
    res.send();
});

// Select List
router.get('/users', auth, async (req, res) => {
    try {
        const data = await EmployeeModel.find({});
        res.send(data);
    } catch (e) {
        res.status(500).send(err);
    }
});

// Select Single Record
router.get('/users/:id', async (req, res) => {

    const _id = req.params.id;
    try {
        const data = await EmployeeModel.findById(_id);

        if (!data) {
            return res.status(404).send('Not Found..');
        }

        res.send(data);
    } catch (e) {
        res.status(500).send(e);
    }

});

// Select User Tasks (Foreign Key Data)
// localhost:5000/usertask/me?limit=2&skip=0&sortBy:createdAt:desc
router.get('/usertask/me', auth, async (req, res) => {

    const match = {};
    const sort = {};

    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });
        res.send(req.user.tasks);
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

// Update User
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Updates!' });
    }

    try {

        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });

        await req.user.save();
        res.send(req.user);

    } catch (e) {
        res.status(400).send(e);
    }

});

// Update By ID
router.patch('/users/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Updates!' });
    }

    const _id = req.params.id;

    try {
        //First Method To Update
        //const data = await EmployeeModel.findByIdAndUpdate(_id,req.body,{new: true,runValidators:true});
        //----------------------------


        //Second Method To Update
        const data = await EmployeeModel.findById(_id);

        updates.forEach((update) => {
            data[update] = req.body[update];
        });

        await data.save();
        //----------------------------

        if (!data) {
            return res.status(404).send('Not Found..');
        }

        res.send(data);

    } catch (e) {
        res.status(400).send(e);
    }

});

// Delete User
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        res.send(req.user);
    }
    catch (e) {
        res.status(500).send(e);
    }
});

// Delete By ID
router.delete('/users/:id', async (req, res) => {
    try {
        const data = await EmployeeModel.findByIdAndDelete(req.params.id);

        if (!data) {
            return res.status(404).send('Not Found..');
        }

        res.send(data);
    }
    catch (e) {
        res.status(500).send(e);
    }
});

// Login GenerateToken
router.post('/users/login', async (req, res) => {
    try {
        const user = await EmployeeModel.findByCredentials(req.body.name, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user: await user.getPublicProfile(), token });
    } catch (e) {
        res.status(400).send(e);
    }
});

// Logout
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((obj) => {
            return obj.token !== req.token;
        });

        await req.user.save();
        res.send();
    }
    catch (e) {
        res.status(500).send();
    }
});

// Logout All
router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    }
    catch (e) {
        res.status(500).send();
    }
});

module.exports = router;

// API Using Promise (Using then)

// Create

// router.post('/newuser',(req,res)=>{ 
//     const newEmployee = new EmployeeModel(req.body);

//     newEmployee.save((err)=>{
//         if(!err)
//         {
//             res.send(req.body);
//         }
//         else
//         {
//             res.status(400).send(err);
//         }
//     });
// });

// Select List

// router.get('/users',(req,res)=>{
//     EmployeeModel.find({}).then((data)=>{
//         res.send(data);
//     }).catch((err)=>{
//         res.status(500).send(err);
//     });
// });

// Select Single Record

// router.get('/users/:id',(req,res)=>{

//     const _id = req.params.id;

//     EmployeeModel.findById(_id).then((data)=>{

//         if (!data)
//         {
//             return res.status(404).send();
//         }

//         res.send(data);

//     }).catch((err)=>{
//         res.status(500).send(err);
//     });
// });