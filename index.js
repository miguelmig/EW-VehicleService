// module to support REST APIs developement.
const express = require('express');
const bodyParser = require('body-parser');
// module to support JSON files parsing and formate confirmation. Used in the POST  request.
const Joi = require('joi');

const app = express();
app.use(
    bodyParser.urlencoded({
      extended: true
    })
)
  
app.use(bodyParser.json())

// MySQL driver to access the database
const mysql = require('mysql');
const {host, user, password, db } = require('./config/db');
var con = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: db
})

process.title = "Vehicle Service"

con.connect((err) => {
    if (err) throw err;
    console.log("MySQL connection estabilished at " + host + "/" + db);
})

app.get('/vehicles/', (req, res) => {
    console.log("GET vehicles");
	con.query("SELECT * FROM vehicles", [], (err, results) => {
        if(err)
        {
            console.log("Error getting vehicles:")
            console.log(err.message);
            return res.status(400).send(err.message);
        }
        return res.status(200).send(results)
    })
});

app.get('/vehicle/:id', (req, res) => {
    console.log("GET vehicle " + req.params.id);
	const vehicle_id = req.params.id;
	con.query("SELECT * FROM vehicles WHERE id = ?", [vehicle_id], (err, results) => {
        if(err)
        {
            console.log("Error getting vehicle: " + vehicle_id);
            console.log(err.message);
            return res.status(400).send(err.message);
        }
        return res.status(200).send(results[0])
    })
});

app.post('/vehicle', (req, res) => {
    console.log("POST vehicle, body: ");
    console.dir(req.body);
    const body = req.body;
    const result = validateCreateInput(body);
    if(result.error)
    {
        console.log("Invalid create input");
        return res.status(400).send(result.error.details[0].message);
    }

    const params = [body.latitude, body.longitude];
	con.query("INSERT INTO vehicles(latitude, longitude) VALUES (?, ?)", params, (err, results) => {
        if(err)
        {
            console.log("Error inserting into database:")
            console.log(err.message);
            return res.status(400).send(err.message);
        }

        return res.status(200).send({"success": true, "id": results.insertId});
    })

})

app.put('/vehicle/', (req, res) => {
    console.log("PUT vehicle, body: ");
    console.dir(req.body);
    var body = req.body;
    const result = validateUpdateInput(body);
    if(result.error)
    {
        return res.status(400).send(result.error.details[0].message);
    }
    const params = [body.latitude, body.longitude, body.id];
	con.query("UPDATE vehicles SET latitude = ?, longitude = ? WHERE id = ?", params, (err, results) => {
        if(err)
        {
            console.log("Error updating vehicle: " + body.id);
            console.log(err.message);
            return res.status(400).send(err.message);
        }

        return res.status(200).send({"success": results.affectedRows == 1});
    })
})

app.delete('/vehicle/:id', (req, res) => {
    console.log("DELETE vehicle, id: " + req.params.id);
    const vehicle_id = req.params.id;
    con.query("DELETE FROM vehicles WHERE id = ?", [vehicle_id], (err, results) => {
        if(err)
        {
            console.log("Error deleting vehicle: " + req.params.id);
            console.log(err.message);
            return res.status(400).send(err.message);
        }

        return res.status(200).send({"success": results.affectedRows == 1});
    })
})

// Setting PORT to listen to incoming requests or by default use port 3000
// Take not that the string in the argument of log is a "back tick" to embedded variable.

const port = process.env.PORT || 3003;

app.listen(port, (req, res) => { 
    console.log(`Listen on port ...${port}`);
});

// function to validate post input parameters 
function validateCreateInput(input)
{
    const schema = {
        latitude: Joi.number().precision(8).required(),
        longitude: Joi.number().precision(8).required(),
    };
    return Joi.validate(input, schema);
}

// function to validate update input parameters 
function validateUpdateInput(input){
    const schema = {
        id: Joi.number().min(1).max(8).required(),
        latitude: Joi.number().precision(8).required(),
        longitude: Joi.number().precision(8).required(),
    };
    return Joi.validate(input, schema);
}