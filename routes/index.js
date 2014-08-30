
/*
 * GET home page.
 */

exports.index = function(req, res){
 res.render('index', {
 	 title: 'Music Genius',
	 powered: 'The Echo Next',
	 made: 'Context Interactive'
     });
};