const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const { admin, functions } = require('./src/utils/firebase');
const users = require('./src/routes/users');
const routes = require('./src/routes/index');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('dev'));
//Use Routes Here
app.use('/v2/auth', users);
app.use('/v1', routes);
//Error Handlers
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});
app.use((err, req, res, next) => {
	res.status(err.status || 500).json({
		errors: {
			message: err.message,
		},
	});
});

exports.api = functions.https.onRequest(app);
