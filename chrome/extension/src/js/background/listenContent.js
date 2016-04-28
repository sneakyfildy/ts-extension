/* global chrome */

define([
    'background/record',
    'background/msgRouter',
    'background/state',
    'background/rt',
    'common/ExtMsgConstructor',
    'common/ActionsList'
], function(record, msgRouter, state, RTConstructor, ExtensionMessage, ActionsList){
    msgRouter.addListener(ActionsList.content.clipboardClick, makeRecordRemote);
    msgRouter.addListener(ActionsList.content.startTicketClick, startTicket);
    window.RT = new RTConstructor({
        url: 'https://www.iponweb.net/rt/REST/1.0/'
    });
    function makeRecord(request, sender, sendResponse){
        var recordString = record.make.apply(record, arguments);
        sendResponse(recordString);
    }
    /**
     *
     * @param {Object} request
     * @param {String} request.id
     * @param {String} request.queue
     * @param {String} request.subject
     * @param {type} sender
     * @param {type} sendResponse
     * @returns {undefined}
     */
    function makeRecordRemote(request, sender, sendResponse){
        var ticketDataFromContent = request.data;
        if (!ticketDataFromContent || !ticketDataFromContent.id){
            throw 'Ticket ID is required to get ticket info from RT';
        }
        RT.getTicket(ticketDataFromContent.id, makeRemoteAnswer.bind(this, sender.tab.id));
    }

    function makeRemoteAnswer(senderTabId, getTicketResponse){
        var recordString;
        getTicketResponse = getTicketResponse || {};
        if ( getTicketResponse.success && getTicketResponse.ticketData){
            recordString = record.make.apply(record, [getTicketResponse.ticketData]);
            chrome.tabs.sendMessage(
                senderTabId,
                new ExtensionMessage({
                    action: ActionsList.content.gotTicketString,
                    data: recordString
                })
            );
        }
    }

    function startTicket(request, sender, sendResponse){
        var ticket = state.startTicket(request.data);
        sendResponse(ticket);
    }
});

