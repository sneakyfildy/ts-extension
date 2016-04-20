/* global chrome */

define('common/dates',[
], function(){
    function Dates(){
    }
    Dates.prototype.weekdays = {
        full: [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ],
        short: [
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat'
        ]
    };
    Dates.prototype.months = {
        full: [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'Decemeber'
        ],
        short: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ]
    };
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
        return value < 10 ? '0' + value : (value + '');
    };

    Dates.prototype.getDayName = function(date, opts){
        opts = opts || {};
        var d = date || new Date();
        return this.weekdays[opts.short ? 'short' : 'full'][d.getDay()];
    };
    Dates.prototype.getMonthName = function(date, opts){
        opts = opts || {};
        var d = date || new Date();
        return this.months[opts.short ? 'short' : 'full'][d.getMonth()];
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
        details.subject = this.sanitizeSubject(details.subject);
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

        this.copy(textArr);
        return textArr;
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

    RecordMaker.prototype.sanitizeSubject = function(before){
        var after;

        after = before.replace(/"/gim, '\'');
        return after;
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
        chrome.tabs.sendMessage(tab.id, {method: "tsGetDetails"}, onGetDetails.bind(this, info));
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
], function (msgRouter, ls) {
    // handles clicks on 'start' popup button (it may change its caption)
    function State() {

    }
    // d is for data
    State.prototype.d = {
        started: false,
        tickets: []
    };

    State.prototype.init = function () {
        if (!this.__init) {
            msgRouter.addListener('getState', this.onMsgGetState.bind(this));
            this.restoreState();
            this.__init = true;
        }
        return this;
    };

    State.prototype.onMsgGetState = function (request, sender, sendResponse) {
        sendResponse(this.getState());
    };

    /**
     *
     * @returns {Boolean} Current state after switch
     */
    State.prototype.toggleDayStart = function () {
        var d = this.d;
        if (d.started) {
            d.started = false;
            d.endTime = new Date().getTime();
        } else {
            d.started = true;
            d.startTime = new Date().getTime();
        }
        this.setState();
    };

    State.prototype.startTicket = function (contentPageData) {
        if (!this.validateTicketData(contentPageData)) {
            return;
        }
        this.d.tickets = this.d.tickets || [];
        var ticket, t;
        t = contentPageData;


        // we'll start with having only one active ticket
        /*
         ticket = this.getTicketById(t.id);
         if (ticket){
            ticket.started = new Date().getTime();
         }else{
         ticket = {
            id: t.id,
            subject: t.subject,
            queue: t.queue,
            started: new Date().getTime()
         };
         this.d.tickets.push(ticket);
         }
         */

        // implementation of single-ticket approach
        this.d.tickets = []; // drop everything
        ticket = {
            id: t.id,
            subject: t.subject,
            queue: t.queue,
            started: new Date().getTime()
        };
        this.d.tickets.push(ticket);

        this.setState();
        this.broadcastUpdateState();

        var n = new Notification('Ticket started', {
            icon: 'img/icon48.png',
            body: ticket.id + ': ' + ticket.subject
        });
        setTimeout(n.close.bind(n), 3000);
        return ticket;
    };

    State.prototype.validateTicketData = function (data) {
        return data.id && data.queue && data.subject;
    };

    State.prototype.getTicketById = function (id) {
        this.d.tickets = this.d.tickets || [];
        return this.d.tickets.filter(function (item) {
            return item.id === id;
        })[0];
    };
    /**
     *
     * @param {Object} opts
     * @returns {Object} State
     */
    State.prototype.setOptions = function (opts) {
        var d = this.d;
        opts = opts || opts;
        this.d.opts = opts;
        
        this.setState();
        this.broadcastUpdateState();

        return this.getState();
    };

    State.prototype.broadcastUpdateState = function () {
        chrome.runtime.sendMessage(
            {action: 'ts_ext_updateState', state: this.d}
        );
    };

    State.prototype.restoreState = function () {
        var state = this.getState();
        if (!!state) {
            this.d = state;
        }
    };

    State.prototype.setState = function () {
        ls.setItem('state', this.d);
    };

    State.prototype.getState = function () {
        return ls.getItem('state') || {};
    };

    return new State().init();

});


/* global module, define */
(function () {
    function moduleDefiniton() {
        /**
         * Manage RT with its REST API
         * @class RT
         * @param {Object} [cfg]
         * @param {String} [cfg.url]
         * @singleton
         */
        function RT(cfg) {

            function init() {
                this.url = cfg.url || this.url; // always put a property in instance, I wanna see it in console
                this.debug = typeof cfg.debug !== 'undefined' ? cfg.debug : this.debug;
            }

            /**
             *
             * @param {Number|String} id
             * @param {Function} [callback]
             * callback param:
             *      {
             *          success: true,
             *          ticketData: {
             *              id: "1",
             *              owner: "you"
             *          },
             *          errorText: ""
             *      }
             * @return {undefined}
             */
            this.getTicket = function (id, callback) {
                var fullUrl;
                fullUrl = this.url + this.getTicketPattern.replace('%id%', id);
                this.ajax({
                    method: 'POST',
                    url: fullUrl,
                    success: this.onGetTicket.bind(this, callback),
                    error: this.onGetTicketError.bind(this, callback)
                });
            };

            return init.call(this);
        }


        var protoStuff = {
            /**
             * @param {String}
             */
            url: 'http://rt.easter-eggs.org/demos/4.2/',
            getTicketPattern: 'ticket/%id%/show',
            debug: true,
            /**
             * Custom AJAX function, implement it yourself if wanna be jquery-independent
             */
            nonJqueryAjax: null,
            onGetTicket: function (callback, res) {debugger;
                var parsedRes = this.parseResponse(res);

                if (!parsedRes.success){
                    this.debug && console.error('Error getting ticket data: ', parsedRes.errorText || '<No error text>');
                }else if ( callback && typeof callback === 'function' ){
                    callback(parsedRes); // assuming scope and everything is bound already
                }
            },
            onGetTicketError: function (callback, res) {
                var errorText = res.statusText || '<No error text>';
                this.debug && console.error('Error getting ticket data: ', errorText, ' Status: ' + res.status);

                if ( callback && typeof callback === 'function' ){
                    callback({
                        success: false,
                        data: {},
                        errorText: errorText
                    });
                }
            },
            parseResponse: function(ticketResponse){
                var r, statusLine, emptyLine, possibleErrorLine, data, line, success, errorText;
                data = {};
                success = true;
                errorText ='';
                r = ticketResponse;
                r = r.split('\n');

                statusLine = r.shift();
                emptyLine = r.shift();
                possibleErrorLine = r[0];

                if (!statusLine || statusLine.toLowerCase().indexOf('200 ok') < 0 || emptyLine !== ''){
                    errorText = 'Something went wrong, incorrect server answer structure.';
                    success = false;
                }else if ( possibleErrorLine && possibleErrorLine.indexOf('#') === 0 ){
                    possibleErrorLine = possibleErrorLine.replace('#', '').replace(/^\s+/gim, '');
                    errorText = possibleErrorLine;
                    success = false;
                }else{
                    for (var i = 0; i < r.length; i++){
                        line = r[i];
                        if (line !== '' && !!line && line.indexOf(': ')){
                            line = line.split(': ');
                            if ( line.length >= 2 ){
                                if (line[0] === 'id'){
                                    line[1] = line[1].replace('ticket/', '');
                                }
                                data[line.shift().toLowerCase()] = line.join(':');
                            }
                        }
                    }
                }

                return {
                    success: success,
                    errorText: errorText,
                    ticketData: data
                };
            },
            ajax: function(ajaxParams){
                if (this.nonJqueryAjax){
                    return this.nonJqueryAjax(ajaxParams);
                }else{
                    return $.ajax(ajaxParams);
                }
            }
        };

        for (var stuffName in protoStuff) {
            if (typeof protoStuff[stuffName] === 'function') {
                RT.prototype[stuffName] = protoStuff[stuffName].bind(RT.prototype);
            } else {
                RT.prototype[stuffName] = protoStuff[stuffName];
            }
        }

        return RT;
    }

    if (typeof define === "function" && define.amd) {
        define('background/rt',[], moduleDefiniton);
    } else if (typeof module === "object" && module.exports) {
        module.exports = moduleDefiniton;
    } else {
        window['RTIConstructor'] = moduleDefiniton();
    }
})();
/* global chrome */

define('background/listenContent',[
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


/* global chrome */

define('background/listenOptions',[
    'background/msgRouter',
    'background/state'
], function(msgRouter, state){
    msgRouter.addListener('setOptions', setOptions);

    function setOptions(request){
        try{
            state.setOptions(request.opts);
        }catch(err){
            // and what?, TODO
        }
    }

});


/**
 * This is the main JS file for background script, it is a subject to grunt's build routine.
 */

require([
    'background/clickHandler',
    'background/listenContent',
    'background/listenPopup',
    'background/listenOptions'
], function(){
});

define("BackgroundMain", function(){});

