define('background/record',[], function(){
    function RecordMaker(){
    }

    RecordMaker.prototype.make = function(details){
        var dateFormatted, date, month, day, endTime, startTime, hours, mins;
        var textArr = [details.queue, details.id, details.subject];

        textArr[1] = 'RT:' + textArr[1];
        textArr[2] = '"' + textArr[2] + '"';
        date = new Date();
        month = date.getMonth() + 1;
        day = date.getDate();
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;
        dateFormatted = date.getFullYear() + '-' + month + '-' + day;

        hours = date.getHours();
        mins = date.getMinutes();
        hours = hours < 10 ? '0' + hours : hours;
        mins = mins < 10 ? '0' + mins : mins;
        endTime = hours + ':' + mins;

        date.setHours(10);
        date.setMinutes(0);
        hours = date.getHours();
        mins = date.getMinutes();
        hours = hours < 10 ? '0' + hours : hours;
        mins = mins < 10 ? '0' + mins : mins;
        startTime = hours + ':' + mins;

        textArr.unshift(endTime);
        textArr.unshift(startTime);
        textArr.unshift(dateFormatted);

        textArr = textArr.join(',');

        console.log(textArr);
        this.copy(textArr);
    };

    RecordMaker.prototype.copy = function(text){
        var copyDiv = document.createElement('div');
        copyDiv.contentEditable = true;
        document.body.appendChild(copyDiv);
        copyDiv.innerHTML = text;
        copyDiv.unselectable = "off";
        copyDiv.focus();
        document.execCommand('SelectAll');
        document.execCommand("Copy", false, null);
        document.body.removeChild(copyDiv);
    };

    return new RecordMaker();
});
/* global chrome */

define('background/clickHandler',['background/record'], function (record) {
    chrome.contextMenus.create(
        {
            title: 'Form TS rec and ctrl+C',
            contexts: ["page", "selection"],
            onclick: onItemClick
        }
    );

    function onItemClick(info, tab) {
        chrome.tabs.sendMessage(tab.id, {text: "tsGetDetails"}, onGetDetails.bind(this, info));
    }

    function onGetDetails(info, details) {
        details = details || {};
        record.make(details);
    }
});
/* global chrome */

define('background/msgRouter',[
], function(){
    function MessageRouter(){
        chrome.runtime.onMessage.addListener(this.messageListener.bind(this));

        this.add = function(a,b){
            this[a] = b;
        };
    }
    // one action - one callback
    MessageRouter.prototype.map = {};

    /**
     * Function, which handles messages
     * @param {Object} request POJO with required 'action' property
     * @param {String} request.action
     * @param {Object} sender Chrome tab
     * @param {Function} sendResponse Call special function, which is waiting for an answer
     * @returns {undefined}
     */
    MessageRouter.prototype.messageListener = function (request, sender, sendResponse) {
        try{
            var action = request.action;
            if ( this.map[action] && typeof this.map[action] === 'function' ){
                this.map[action](request, sender, sendResponse); // provide already bound functions if needed
            }
        }catch(err){
            console.warn('Message processing has failed. Let the developer know about that.')
        }
    };
    
    /**
     * Add one association "action->handler", which is checked with every
     * message came
     * @param {String} action
     * @param {Function} callback
     * @returns {undefined}
     */
    MessageRouter.prototype.addListener = function (action, callback) {
        this.map[action] = callback; // one action - one callback
    };

    return new MessageRouter();

});


/* global chrome */

define('background/listenButton',[
    'background/record',
    'background/msgRouter'
], function(record, msgRouter){
    msgRouter.addListener('ticketDetails', record.make.bind(record));
});


/**
 * This is the main JS file for background script, it is a subject to grunt's build routine.
 */

require([
    'background/clickHandler',
    'background/listenButton'
], function(){
});

define("BackgroundMain", function(){});

