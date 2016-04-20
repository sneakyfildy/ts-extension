/* global chrome */

define([
    'background/record',
    'background/msgRouter',
    'background/state',
    'background/rt'
], function(record, msgRouter, state, RTConstructor){
    msgRouter.addListener('ticketDetails', makeRecordRemote);
    msgRouter.addListener('startTicket', startTicket);
    //https://www.iponweb.net/rt/REST/1.0/
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
    function makeRecordRemote(request, sender, sendResponse){debugger;
        //var recordString = record.make.apply(record, arguments);
        //sendResponse(recordString);
        var ticketData = RT.getTicket(request.id, makeRemoteAnswer.bind(this, sender.tab.id));
    }

    function makeRemoteAnswer(senderTabId, getTicketResponse){debugger;
        var recordString;
        getTicketResponse = getTicketResponse || {};
        if ( getTicketResponse.success && getTicketResponse.ticketData){
            recordString = record.make.apply(record, [getTicketResponse.ticketData]);
            chrome.tabs.sendMessage(
                senderTabId,
                {
                    text: recordString,
                    method: 'tsBringTicketString'
                }
            );
        }
    }

    function startTicket(request, sender, sendResponse){
        var ticket = state.startTicket(request);
        sendResponse(ticket);
    }
});

