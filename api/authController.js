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
						message: 'Error in authentication. Report the problem'
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
				
                
				var savedNewCardToggler;
                var cardDetailDisplay;
                var lastFour;

                //if saved card information is available, userDetail will have customerId
				if (userDetail.customerId) {
                    //Saved card information is available
                    savedNewCardToggler = "style=display:block"; //Gives options to use the saved card or a new card
                    lastFour = userDetail.lastFour;//To indicate which saved card is used
					cardDetailDisplay = "style=display:none"; //Hides the card detail input fields
                    
				}
				else {
                    //Saved card information is NOT available
					savedNewCardToggler = "style=display:none";//The user has to input the card detail. No options required.
                    lastFour = "";
                    cardDetailDisplay = "style=display:block"; //Shows the card detail input fields
				}

                // return the information including token as JSON
				res.render( 'transactions', {
							token: token,
                            savedNewCardToggler: savedNewCardToggler,
                            lastFour: lastFour,
							cardDetailDisplay: cardDetailDisplay,
							title: 'Transactions Page'
						}
				);
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
            //throw err;
            console.log(err);
            return res.status( 500 ).json( {
                success: false,
                message: 'Error in accessing database. Report the problem'
            } );
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
                var token = jwt.sign( user.toObject(), config.secret, {
                    expiresIn: 1440 // expires in 24 hours
                } );

				//The user is just registered. Yet to make a payment. No card info available
                var lastFour="";
                var savedNewCardToggler = "style=display:none"; //No option to use the saved card.
                var cardDetailDisplay   = "style=display:block"; //Display card detail input fields
                
                // return the information including token as JSON
                res.render( 'transactions', {
                    token: token,
                    savedNewCardToggler: savedNewCardToggler,
                    lastFour: lastFour,
					cardDetailDisplay: cardDetailDisplay,
                    title: 'Transactions Page'
                } );
            } );
        }

    } );
};
