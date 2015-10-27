var fs = require('fs');
var path = require('path');
var uuid = require('uuid');
var redis = require('redis-mock').createClient();
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;

var marked = require('marked');
marked.setOptions({
	renderer: new marked.Renderer(),
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: false
});

var feedResponse = require('./feeds/response');

var app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));

passport.use(new BasicStrategy(function (username, password, done) {
	if (username === 'agnostechvalley' && password === 'polyglot') {
		done(null, {
			username: username
		});
	} else {
		done(null, false);
	}
}));

passport.use(new BearerStrategy(function (token, done) {
	redis.get('TOKEN:' + token, function (err, result) {
		if (err) {
			return done(err);
		}

		if (result) {
			done(null, result);
		} else {
			done(null, false);
		}
	});
}));

app.get('/', function (req, res) {
	fs.readFile(path.join(__dirname, '/README.md'), 'utf-8', function (err, data) {
		if (err) {
			res.status(500).send(err);
		}

		res.send(marked(data));
	});
});

app.post('/auth', function (req, res) {
	if (req.body.username && req.body.password) {
		var token = uuid.v4();
		redis.set('TOKEN:' + token, req.body, function (err) {
			if (err) {
				res.status(500).send(err);
			}

			res.status(201).send({token: token});
		});
	} else {
		res.status(400).send('Username/Password Not Defined');
	}
});

app.get('/feed-basic', passport.authenticate('basic', {session: false}), feedResponse);
app.get('/feed-bearer', passport.authenticate('bearer', {session: false}), feedResponse);

app.listen(process.env.PORT || 3000);
