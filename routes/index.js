
/*
 * GET home page.
 */

exports.index = function(req, res){
 res.render('index', {
	 powered: 'The Echo Next',
	 made: 'Context Interactive'
     });
};