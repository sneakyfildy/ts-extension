/* global chrome */

define([
    'background/record',
    'common/ExtMsgConstructor',
    'common/ActionsList'
], function (record, ExtensionMessage, ActionsList) {
    chrome.contextMenus.create(
        {
            title: 'Form TS rec and ctrl+C',
            contexts: ["page", "selection"],
            onclick: onItemClick
        }
    );

    // context menu click handler
    function onItemClick(info, tab) {
        chrome.tabs.sendMessage(
            tab.id,
            new ExtensionMessage({
                action: ActionsList.content.contextMenuClick,
                data: ''
            }),
            onGetDetails.bind(this, info)
        );
    }

    function onGetDetails(info, details) {
        details = details || {};
        record.make(details);
    }
});