/* global chrome */

define(['background/record'], function(record){
        chrome.contextMenus.create(
            {
                title: 'Form TS rec and ctrl+C',
                contexts: ["page", "selection"],
                onclick: onItemClick
            }
        );

    function onItemClick(info, tab){
        chrome.tabs.sendMessage(tab.id, {text: "tsGetDetails"}, onGetDetails.bind(this, info));
    }

    function onGetDetails(info, details){
        details = details || {};
        record.make(details);
    }
});