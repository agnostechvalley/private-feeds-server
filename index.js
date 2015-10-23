var fs = require('fs');
var path = require('path');
var uuid = require('uuid');
var redis = require('redis-mock').createClient();
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;
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

var app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));

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

app.get('/feed', passport.authenticate('bearer', {session: false}), function (req, res) {
	res.format({
		'application/json': function () {
			fs.readFile(path.join(__dirname, '/feeds/rss.json'), function (err, data) {
				if (err) {
					res.status(500).send(err);
				}

				res.send(data);
			});
		},

		'application/rss+xml': function () {
			fs.readFile(path.join(__dirname, '/feeds/rss.xml'), function (err, data) {
				if (err) {
					res.status(500).send(err);
				}

				res.send(data);
			});
		},

		'default': function () {
			res.status(406).send('Not Acceptable');
		}
	});
});

app.listen(process.env.PORT || 3000);
