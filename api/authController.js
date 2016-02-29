'use strict';

var User = require( '../models/user.model.js' );
var jwt = require( 'jsonwebtoken' );
var config = require( '../config' );

exports.index = function( req, res ) {

    // find the user
    User.findOne( {
        name: req.body.name
    }, function( err, user ) {

        if ( err ) {
            //throw err;
			console.log(err);
			return res.status( 500 ).json( {
                success: false,
                message: 'Error in accessing database. Report the problem'
            } );
        }

        if ( !user ) {
            res.json( {
                success: false,
                message: 'Authentication failed. User not found.'
            } );
        }
        else if ( user ) {
            user.comparePassword( req.body.password, function( err, isMatch ) {
                if ( err ) {
                    //throw err;
					console.log(err);
					return res.status( 500 ).json( {
						success: false,
						message: 'Error in accessing database. Report the problem'
					} );
                }

                if(!isMatch) {
                    return res.status( 401 ).json( {
                        success: false,
                        message: 'Authentication failed. Wrong password.'
                    } );
                }

                // if user is found and password is right
                // create a token
                var token = jwt.sign( user.toObject(), config.secret, {
                    expiresIn: 1440 // expires in 24 hours
                } );

				//get the user detail to a plain object
				var userDetail = user.toObject();
				
                // return the information including token as JSON
				var cardDetailDisplay;
				if (userDetail.customerId) {
					cardDetailDisplay = "style=display:none";
				}
				else {
					cardDetailDisplay = "style=display:block";
				}
				res.render( 'transactions', {
							token: token,
							cardDetailDisplay: cardDetailDisplay,
							title: 'Transactions Page'
						}
				);
/*				
				if (userDetail.customerId) {
					res.render( 'transactions-with-saved-info', {
							token: token,
							cardDetailDisplay : 'style="display:none"',
							title: 'Transactions Page'
						}
					);
				}
				else {
					res.render( 'transactions', {
							token: token,
							title: 'Transactions Page'
						} 
					);
				}
*/
            } );
        }

    } );
};

exports.register = function( req, res ) {

    // find the user
    User.findOne( {
        name: req.body.name
    }, function( err, user ) {

        if ( err ) {
            throw err;
        }

        if ( user ) {
            res.json( {
                success: false,
                message: 'Register failed. Username is not free'
            } );
        }
        else {
            user = new User( {
                name: req.body.name,
                password: req.body.password
            } );
            user.save( function( err ) {
                if ( err ) {
                    return res.status( 500 ).json( {
                        success: false,
                        message: 'Registration failed'
                    } );
                }

                // if user is found and password is right
                // create a token
                var token = jwt.sign( user, config.secret, {
                    expiresIn: 1440 // expires in 24 hours
                } );

				var cardDetailDisplay = "style=display:block";
                // return the information including token as JSON
                res.render( 'transactions', {
                    token: token,
					cardDetailDisplay: cardDetailDisplay,
                    title: 'Transactions Page'
                } );
            } );
        }

    } );
};
