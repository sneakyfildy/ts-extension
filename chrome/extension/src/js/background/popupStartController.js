/* global chrome */

define([
    'background/state'
], function(state){
    // handles clicks on 'start' popup button (it may change its caption)
    function PopupStartController(){

    }

    PopupStartController.prototype.onClick = function(request, sender, sendResponse){
        state.toggleDayStart();
        sendResponse(state.d);
    };

    return new PopupStartController();

});

