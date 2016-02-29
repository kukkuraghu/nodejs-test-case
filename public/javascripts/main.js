'use strict';

/*global Stripe:true*/
/*global $form:true*/

//set Public key for Stripe payments
Stripe.setPublishableKey( 'pk_test_l3IALLNjDoiEVhgTXu2WXuhD' );
var isSubmit = false;
var stripeToken = "";

$( document ).ready( function() {
    $( '#submittransaction' ).on("click", submitTransaction);    
});

function submitTransaction() {
    var isNewCard = checkForNewCard();
    if (isNewCard) {
        Stripe.card.createToken( {
                number: $( '.card-number' ).val(),
                cvc: $( '.card-cvc' ).val(),
                exp_month: $( '.card-expiry-month' ).val(),
                exp_year: $( '.card-expiry-year' ).val()
            }, 
            function( status, response ) {
                if ( response.error ) {
                    // Show the errors on the form
                    $( '.payment-errors' ).text( response.error.message );
                }
                else {
                    // response contains id and card, which contains additional card details
                    stripeToken = response.id;
                    sendData();
                }
            } 
        );
    }
    else {
        sendData();
    }
}
function sendData() {
    $.ajax( {
                url: '/createtransaction',
                type: 'POST',
                headers: {
                    'x-access-token': $( '#token' ).html()
                },
                data: {
                    amount: $( '#amount' ).val(),
                    currency: $( '#currency' ).val(),
                    stripeToken: stripeToken
                }
            } ).done( function( response ) {
                if ( response.message ) {
                    $( '.payment-errors' ).text( response.message );
                }
    } );
}
function checkForNewCard() {
//*** TO DO - Add better a logic for checking new payment instrument
    //check if the card detail  div is visible. If it is visible, new card is used.
    console.log("New Payment Instrument used : " + $( "#card-detail-div" ).is(":visible"));
    return $( "#card-detail-div" ).is(":visible");
}

/*
$( document ).ready( function() {
    $( '#submittransaction' ).click( function() {
        console.log( 'ok' );
		var stripeToken = "";
        if ( !isSubmit ) {
            Stripe.card.createToken( {
                number: $( '.card-number' ).val(),
                cvc: $( '.card-cvc' ).val(),
                exp_month: $( '.card-expiry-month' ).val(),
                exp_year: $( '.card-expiry-year' ).val()
            }, function( status, response ) {
                if ( response.error ) {
                    // Show the errors on the form
                    $( '.payment-errors' ).text( response.error.message );
                }
                else {
                    // response contains id and card, which contains additional card details
                    stripeToken = response.id;
                    // Insert the token into the form so it gets submitted to the server
					//stripe token value is passed through data in the ajax call, no need to add to the form data.
                    //$form.append( $( '<input type="hidden" name="stripeToken" />' ).val( token ) );
                    // and submit
                    $.ajax( {
                        url: '/createtransaction',
                        type: 'POST',
                        headers: {
                            'x-access-token': $( '#token' ).html()
                        },
                        data: {
                            amount: $( '#amount' ).val(),
                            currency: $( '#currency' ).val(),
                            stripeToken: stripeToken
                        }
                    } ).done( function( response ) {
                        if ( response.message ) {
                            $( '.payment-errors' ).text( response.message );
                        }
                    } );
                }

            } );
        }
    } );
} );
*/