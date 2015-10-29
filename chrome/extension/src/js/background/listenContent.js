/* global chrome */

define([
    'background/record',
    'background/msgRouter',
    'background/state'
], function(record, msgRouter, state){
    msgRouter.addListener('ticketDetails', makeRecord);
    msgRouter.addListener('startTicket', startTicket);

    function makeRecord(request, sender, sendResponse){
        var recordString = record.make.apply(record, arguments);
        sendResponse(recordString);
    }

    function startTicket(request, sender, sendResponse){
        var ticket = state.startTicket(request);
        sendResponse(ticket);
    }
});

