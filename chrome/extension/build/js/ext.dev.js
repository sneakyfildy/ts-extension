/* global chrome */

define('common/dates',[
], function(){
    function Dates(){
    }

    Dates.prototype.getFullDate = function (date, needSex) {
        return this.getHumanDate(date) + ' ' + this.getHumanTime(date, needSex);
    };

    Dates.prototype.getHumanDate = function (date) {
        var month, day, dateFormatted;
        date = new Date(date.getTime());
        month = this.xx( date.getMonth() + 1 );
        day = this.xx( date.getDate() );
        dateFormatted = date.getFullYear() + '-' + month + '-' + day;

        return dateFormatted;
    };

    Dates.prototype.getHumanTime = function (date, needSex) {
        var hours, mins, sex, dateFormatted;
        hours = this.xx( date.getHours() );
        mins = this.xx( date.getMinutes() );
        sex = this.xx( date.getSeconds() ); // "secs" =)
        dateFormatted = hours + ':' + mins + (needSex ? (':' + sex) : '');

        return dateFormatted;
    };
    /**
     * Two digits, '1' -> '01'
     * @param {Number} value
     * @returns {String}
     */
    Dates.prototype.xx = function (value) {
        value = parseInt(value, 10);
        return value < 10 ? '0' + value : value;
    };

    return new Dates();

});


define('background/record',[
    'common/dates'
], function(dates){
    function RecordMaker(){
    }

    RecordMaker.prototype.make = function(details){
        var dateFormatted, date, month, day, endTime, startTime, hours, mins;
        var textArr = [details.queue, details.id, details.subject];

        textArr[1] = 'RT:' + textArr[1];
        textArr[2] = '"' + textArr[2] + '"';
        date = new Date();
        dateFormatted = dates.getHumanDate(date);

        endTime = dates.getHumanTime(date);

        date.setHours(10);
        date.setMinutes(0);

        startTime = dates.getHumanTime(date);

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
        this.actionPrefix = 'ts_ext_';
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
            console.warn('Message processing has failed. Let the developer know about that.');
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
        this.map[this.actionPrefix + action] = callback; // one action - one callback
    };

    return new MessageRouter();

});


/* global chrome */

define('background/listenContent',[
    'background/record',
    'background/msgRouter'
], function(record, msgRouter){
    msgRouter.addListener('ticketDetails', record.make.bind(record));
});


/* global chrome */

define('background/localStorage',[
], function(){
    var ls = window.localStorage;
    // handles local storage
    function Storage(){

    }

    Storage.prototype.setItem = function(name, item, skipStringify){
        try{
            ls.setItem(name, skipStringify ? item : JSON.stringify(item));
        }catch(err){
            console.error('setItem fails', err);
            return false;
        }
        return true;
    };

    Storage.prototype.getItem = function(name, skipParse){
        var item;
        try{
            item = ls.getItem(name);
            item = skipParse ? item : JSON.parse(item);
        }catch(err){
            console.error('setItem fails', err);
            return false;
        }
        return item;
    };

    return new Storage();

});


/* global chrome */

define('background/state',[
    'background/msgRouter',
    'background/localStorage'
], function(msgRouter, ls){
    // handles clicks on 'start' popup button (it may change its caption)
    function State(){

    }
    // d is for data
    State.prototype.d = {
        started: false
    };

    State.prototype.init = function(){
        if ( !this.__init ){
            msgRouter.addListener('getState', this.onMsgGetState.bind(this));
            this.restoreState();
            this.__init = true;
        }
        return this;
    };

    State.prototype.onMsgGetState = function(request, sender, sendResponse){
        sendResponse(this.getState());
    };

    /**
     *
     * @returns {Boolean} Current state after switch
     */
    State.prototype.toggleDayStart = function(){
        var d = this.d;
        if (d.started){
            d.started = false;
            d.endTime = new Date().getTime();
        }else{
             d.started = true;
             d.startTime = new Date().getTime();
        }
        this.setState();
    };

    State.prototype.restoreState = function(){
        var state = this.getState();
        if (!!state){
            this.d = state;
        }
    };

    State.prototype.setState = function(){
         ls.setItem('state', this.d);
    };
    State.prototype.getState = function(){
         return ls.getItem('state');
    };

    return new State().init();

});


/* global chrome */

define('background/popupStartController',[
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


/* global chrome */

define('background/listenPopup',[
    'background/msgRouter',
    'background/popupStartController'
], function(msgRouter, popupStartController){
    msgRouter.addListener('popupStartButton', popupStartController.onClick.bind(popupStartController));
});


/**
 * This is the main JS file for background script, it is a subject to grunt's build routine.
 */

require([
    'background/clickHandler',
    'background/listenContent',
    'background/listenPopup'
], function(){
});

define("BackgroundMain", function(){});

