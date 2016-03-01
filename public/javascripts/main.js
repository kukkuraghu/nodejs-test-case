'use strict';

/*global Stripe:true*/
/*global $form:true*/

//set Public key for Stripe payments
Stripe.setPublishableKey( 'pk_test_l3IALLNjDoiEVhgTXu2WXuhD' );


$(document).ready(function() {
    $( '#submittransaction' ).on("click", submitTransaction); //Submitting payment
    $( '#use-new-pymt-id' ).on("click", showNewCardDetail); //Customer prefers to use another card. Not the stored one. Show the card detail input fields.
    $( '#use-saved-pymt-id' ).on("click", hideNewCardDetail); //Customer prefers to use the stored card. Hide the card detail input fields.
});


//event handler for clicking the payment submit button
function submitTransaction() {
    $("#submittransaction").attr("disabled", true); //disble the submit button - to avoid repeated submissions.
    var stripeToken = "";
    var lastFour = "";
    var isNewCard = checkForNewCard();//whether the customer is using the saved card or new card for payment? 
    if (isNewCard) {
        //When a new card is used, no need to show the options for payments
        $("#saved-New-Card-Toggler-div").hide();
        
        //if a new card is used for payment, get stripe token
        Stripe.card.createToken({
                number: $( '.card-number' ).val(),
                cvc: $( '.card-cvc' ).val(),
                exp_month: $( '.card-expiry-month' ).val(),
                exp_year: $( '.card-expiry-year' ).val()
            }, 
            function(status, response) {
                if (response.error) {
                    // Show the errors on the form
                    $('.payment-errors').text( response.error.message );
                    $("#submittransaction").removeAttr("disabled");//enable the submit button
                }
                else {
                    stripeToken = response.id;
                    lastFour = response.card.last4; 
                    //when a new card is used, stripe token is required for charging the card. So sending it to the server.   
                    //Using the last four digits as a reference to the card used. So that the customer is clear on which card is used for payment for future payments.
                    sendData(stripeToken, lastFour);
                }
            } 
        );
    }
    else {
        //Customer is using the saved card information for payment.
        //No need to send the stripe token for the payment using saved card.
        sendData();
    }
}

//Makes the ajax call to the server to make the payment.
//stripeToken - is required, if the payment is done using a new card.
//Using the last four digits as a reference to the card used. So that the customer is clear on which card is used for payment for future payments.
function sendData(stripeToken, lastFour) {
    stripeToken = stripeToken || "";
    lastFour = lastFour || "";
    $.ajax( {
                url: '/createtransaction',
                type: 'POST',
                headers: {
                    'x-access-token': $( '#token' ).html()
                },
                data: {
                    amount: $( '#amount' ).val(),
                    currency: $( '#currency' ).val(),
                    stripeToken: stripeToken,
                    lastFour:lastFour
                },
                complete: function() {
                    $("#submittransaction").removeAttr("disabled");//enable the submit button
                },
                success: function(response) {
                    if ( response.message ) {
                        $( '.payment-errors' ).text( response.message );
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log(textStatus);
                    console.log(errorThrown);
                    $( '.payment-errors' ).text( textStatus + " " + errorThrown );
                }
    });
}

//Checks if card detail fields are visible. If visible returns true else false.
function checkForNewCard() {
    return $( "#card-detail-div" ).is(":visible");
}

//displays the input fields to capture the card detail
function showNewCardDetail() {
    $('#card-detail-div').show();
}

//hides the input fields to capture the card detail
function hideNewCardDetail() {
    $('#card-detail-div').hide();
}
