/* global chrome */

define([
    'background/record',
    'background/msgRouter',
    'background/state',
    'background/rt',
    'background/user',
    'common/ExtMsgConstructor',
    'common/ActionsList'
], function(record, msgRouter, state, RTConstructor, User, ExtensionMessage, ActionsList){
    msgRouter.addListener(ActionsList.content.clipboardClick, createSomethingByTicketData);
    msgRouter.addListener(ActionsList.content.startTicketClick, createSomethingByTicketData);

    msgRouter.addListener(ActionsList.content.confluenceToggleMe, getUserAndReturn);

    var RT = new RTConstructor({
        url: 'https://www.iponweb.net/rt/REST/1.0/'
    });

    function makeRecord(ticketData){
        return record.make.apply(record, [ticketData]);
    }

    function startTicket(ticketData){
        return state.startTicket(ticketData);
    }

    /**
     * General function, must be bound with sender tab id and keyFunction
     * it receives ticket data from RT as 3rd argument, calls keyFunction method and
     * returns result via chome message into the sender tab by its id
     * @param {Number|String} senderTabId
     * @param {Function} keyFunction
     * @param {Object} ticketResponse
     * @returns {undefined}
     */
    function makeAnswer(senderTabId, keyFunction, ticketResponse){
        var result = {};
        ticketResponse = ticketResponse || {};
        if ( ticketResponse.success && ticketResponse.ticketData){
            try{
                result = keyFunction(ticketResponse.ticketData);
            }catch(err){
                console.error('Error while running keyFunction inside makeAnswer', err);
            }
            chrome.tabs.sendMessage(
                senderTabId,
                new ExtensionMessage({
                    action: ActionsList.content.gotTicketString,
                    data: result
                })
            );
        }
    }

    function createSomethingByTicketData(request, sender){
        var keyFunction;
        if (!request.data || !request.data.id){
            throw 'Ticket ID is required to get ticket info from RT';
        }
        switch(request.action){
            case ActionsList.content.clipboardClick:
                keyFunction = makeRecord;
                break;
            case ActionsList.content.startTicketClick:
                keyFunction = startTicket;
                break;
        }
        RT.getTicket(request.data.id, makeAnswer.bind(this, sender.tab.id, keyFunction));
    }

    function getUserAndReturn(request, sender){
        var senderId = sender.tab.id;
        if (!!User.name){
            giveUsernameForConfluence(senderId, User.name);
        }else{
            User.update(
                giveUsernameForConfluence.bind(senderId)
            );
        }
    }

    function giveUsernameForConfluence(senderId, name){
        chrome.tabs.sendMessage(
            senderId,
            new ExtensionMessage({
                action: ActionsList.content.gotNameForToggle,
                data: name
            })
        );
    }
});

