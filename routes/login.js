/* Login JS */

exports.list = function(req, res) {
	res.render('login.ejs', {
		title: 'Music Genius',
		phrase: 'Welcome to Music Genius'
	});
};