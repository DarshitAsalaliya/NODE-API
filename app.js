const express = require('express'); 
const app = express();

// DOTENV
require('dotenv').config();
const port = process.env.PORT || 3000;

// For JSON Support
app.use(express.json());

// Connection
require('./src/db/connection');

// Set Employee Router
const employeeRouter = require('./src/routers/Employee');
app.use(employeeRouter);

// Set Task Router
const taskRouter = require('./src/routers/Task');
app.use(taskRouter);

// Server
app.listen(port, ()=>{

});
