'use strict';

// eslint-disable-next-line import/no-unresolved
const express = require('express');
var bcrypt = require('bcryptjs');

// const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const constants = require('./constants/constants');
const bodyParser = require('body-parser');
const app = express();
var swagger = require('swagger-ui-express');
var swaggerDocument = require(constants.SWAGGER);
var swaggerAdminDocument = require(constants.SWAGGER_ADMIN);

var mongoConnection = require('./constants/mongo_connection');
const loginModel = require("./models/loginModel");

app.use(bodyParser.json({limit: '10mb'}));                          // log every request to the console
app.use(bodyParser.urlencoded({limit: '10mb','extended':'true'}));            // parse application/x-www-form-urlencoded                                // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.json({ limit: '20mb' })); //to parse the stream of data that came as a json to be available into req.body

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());


// Routes
mongoConnection.mongoConnect();


app.use('/api-docs', swagger.serve, swagger.setup(swaggerDocument));
app.use('/allapi-docs', swagger.serve, swagger.setup(swaggerAdminDocument));
app.use('/v1', require('./routes/companyRoutes'));
app.use('/v2', require('./routes/companyRoutesV2'));


app.get('/*', (req, res) => {
  loginModel.findOne({email:"shivamwadhwa07@gmail.com"})
    .then(data => {
      res.json({
        status:200,
        results:data
      })
    }).catch( err => res.json({
      status:400,
      results: err
    }) )
  // res.send(`Request received: ${req.method} - ${req.path}`);
});

// Error handler
app.use((err, req, res) => {
  console.error(err);
  res.status(500).send('Internal Serverless Error');
});

// app.listen(4000, () => {
//   console.log(`Example app listening at http://localhost:${4000}`)
// })

module.exports = app;

// serverless deploy --region eu-west-2