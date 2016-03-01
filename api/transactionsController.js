'use strict';

var User = require( '../models/user.model.js' );
var Transactions = require( '../models/transactions.model.js' );
var config = require( '../config' );
var stripe = require( 'stripe' )( config.stripeApiKey );

exports.index = function( req, res, next ) {
    if ( req.body ) {
        var transaction = new Transactions( {
            name: req.body.name
        } );
        transaction.save( function( err, trans ) {
            if ( err ) {
                return console.log( err );
            }
            res.status( 200 ).end();
        } );
    }
};

exports.createTransaction = function( req, res, next ) {
    //req.body will have a stripeToken, if a new credit card is used.
    if(req.body.stripeToken) {
        //new credit card is used. Create a customer ID.
        var custCreatePromise = createCustomerId(req.body.stripeToken);
        custCreatePromise.then(custCreationSuccess, custCreationFailure);
    }
    else {
        //saved credit card is used. Charge the card using customer id.
        //customerId available on req.decoded - decoded from the token.
        var chargeCustPromise = chargeCustomer(req.decoded.customerId);
        chargeCustPromise.then(chargeCustSuccess, chargeCustFailure);
    }

    //Stripe customer creation promise resolution handler.
    //Stripe has created the customer Id. 
    //Calls the stripe api to charge the customer.
    //Updates the User with the customer id.
    function custCreationSuccess(customer) {
            var chargeCustPromise = chargeCustomer(customer.id);
            chargeCustPromise.then(chargeCustSuccess, chargeCustFailure);
            User.findOneAndUpdate(  {name:req.decoded.name}, 
                                    {customerId : customer.id, lastFour : req.body.lastFour},
                                    function(error, dbCustomer) {
                                        if(error) {
                                            //Customer Id is not stored in the database.
                                            //That means the card used for payment can not be stored.
                                            //Only logging the error. No other action.
                                            //Either the user has to input the card info for next payment,
                                            //Or has to use the previously stored card
                                            console.log(error);
                                            console.log("Error in updating user with customer id");
                                        }
                                        else {
                                            if(dbCustomer){
                                                console.log("User updated with customer id");
                                            }
                                            else {
                                                console.log("User is not updated with customer id");
                                            }
                                            
                                        }
                                    }
            );
    }
    

    //Stripe customer creation promise rejection handler.
    //Stripe could not create the customer object.
    //Sends the status back to the customer.
    function custCreationFailure(error) {
        var message = 'Payment is failed.' + error.type; 
        console.log(error);
        res.status( 200 ).json( {
            message: message
        } );
    }


    //Calls the Stripe api to create customer object
    //Param : valid Stripe Token
    //Returns a promise
    function createCustomerId(stripeToken) {
        return  stripe.customers.create({
                    source: stripeToken,
                    description: 'paying user@example.com'
                });
    }

    //Calls the Stripe api to charge against customer ID.
    //Param : Customer Id
    //Returns a promise
    function chargeCustomer(customerId) {
        return  stripe.charges.create({
                    amount: req.body.amount, // amount in cents, again
                    currency: req.body.currency,
                    customer: customerId
                });
    }

    //Stripe  chargeCustomer  promise (chargeCustPromise) resolution handler.
    //Stripe has charged against the customer Id. 
    //Tries to log the transaction in the database.
    //If successful sends the message  to the user.
    //If logging failed, sends the message to the user. Error message is logged.
    function chargeCustSuccess(charge){
        var transaction = new Transactions( {
                transactionId: charge.id,
                amount: charge.amount,
                created: charge.created,
                currency: charge.currency,
                description: charge.description,
                paid: charge.paid,
                sourceId: charge.source.id
        } );
        transaction.save( function( err ) {
                if ( err ) {
                    console.log("Card is charged. But the transcation is not logged in the database");
                    console.log(charge.id + " " + charge.amount + charge.currency);
                    res.status( 200 ).json( {
                        message: 'Card is charged. But transcation is not logged in the database. Contact Helpdesk'
                    });
                }
                else {
                    res.status( 200 ).json( {
                        message: 'Payment is created.'
                    } );
                }
        } );
    }

    //Stripe  chargeCustomer  promise (chargeCustPromise) rejection handler.
    //Stripe could not charge against the customer Id. 
    //Sends the message  to the user.
    function chargeCustFailure(error){
        res.status( 200 ).json( {
            message: 'Payment is failed.' + error.type + " " + error.message
        } );
    }
};