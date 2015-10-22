/* global chrome */

define(['background/record'], function(record){
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.action !== "ticketDetails"){ return; }
            record.make(request);
        }
    );
});

