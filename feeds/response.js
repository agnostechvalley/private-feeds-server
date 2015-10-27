var fs = require('fs');
var path = require('path');

module.exports = function (req, res) {
	res.format({
		json: function () {
			fs.readFile(path.join(__dirname, '/rss.json'), function (err, data) {
				if (err) {
					res.status(500).send(err);
				}

				res.send(data);
			});
		},

		default: function () {
			fs.readFile(path.join(__dirname, '/rss.xml'), function (err, data) {
				if (err) {
					res.status(500).send(err);
				}

				res.send(data);
			});
		}
	});
};
