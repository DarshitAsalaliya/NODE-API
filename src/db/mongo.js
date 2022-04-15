const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/EmployeeManagement',{
    useNewUrlParser: true
})

const employeeSchema = new mongoose.Schema({
    name: {
        type:String,
        unique:[true,'Name must be unique'],
        trim: true,
        default: 'ABC',
        lowercase:true,
        validate(val){
            if(val=='Darshit')
            {
                throw new Error('Invalid Name..');
            }
        }
    },
    age: Number
});

const Employee = mongoose.model('Employee',employeeSchema,'Employee');

const newEmployee = new Employee({
    name:"   Darshit Asalaliya   ",
    age:23
});

newEmployee.save((err)=>{
    if(!err)
    {
        console.log('Saved..');
    }
    else
    {
        console.log(err);
    }
});

