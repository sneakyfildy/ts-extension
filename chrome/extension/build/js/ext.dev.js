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
            console.warn('Message processing has failed. Let the developer know about that.' + err);
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


define('common/ExtMsgConstructor',[
], function(){
    function ExtMsgConstructor(config){
        if (typeof config.action === 'undefined' || typeof config.data === 'undefined'){
            throw 'Action and data properties are required';
        }

        this.action = config.action;
        this.data = config.data;

        if (this.action.indexOf(this.actionPrefix) < 0){
            this.action = this.addPrefix(this.action);
        }
    }
    ExtMsgConstructor.prototype.actionPrefix = 'ts_ext_';
    ExtMsgConstructor.prototype.addPrefix = function(sourceStr){
        var readyAction = sourceStr.indexOf(this.actionPrefix) < 0 ? (this.actionPrefix + sourceStr) : sourceStr;
        return readyAction;
    };

    return ExtMsgConstructor;
});
define('common/ActionsList',[
    'common/ExtMsgConstructor'
], function(msg){
    var transform = msg.prototype.addPrefix.bind(msg.prototype);
    var ActionsList = {
        popup: {
            startClick: transform('popupStartButton'),
            needState: transform('popupNeedState'),
            gotState: transform('popupGotState')
        },
        content: {
            clipboardClick: transform('getTicketData'),
            contextMenuClick: transform('getTicketDataByContextMenu'),
            startTicketClick: transform('startTicketClick'),
            gotTicketString: transform('hereIsTheTicketString'),
            confluenceToggleMe: transform('confluenceToggleMe'),
            gotNameForToggle: transform('hereIsUserNameForConfluenceToggleMe')
        },
        state: {
            need: transform('generalNeedState'),
            got: transform('generalGotState')
        },
        user: {
            need: transform('generalNeedUser'),
            got: transform('generalGotUser')
        },
        workedTime: {
            needUpdate: transform('pleaseUpdateWorkedTime')
        }
    };

    return ActionsList;
});
define('common/NotifModule',[
], function(){
    /**
     * @class NotifModule
     * @param {Object} config
     */
    function NotifModule(config){
        config = config || {};
        /**
         * @cfg {Number} milliseconds to autoclose
         */
        this.defaultTimeout = config.timeout || 3000;
        /**
         * @cfg {String} path to icon
         */
        this.defaultIcon = config.icon || 'img/icon48.png';
    }

    /**
     * Shows notif
     * @param {Object} config
     * @param {Number} [config.timeout] milliseconds to autoclose,
     * if undefined - {@link NotifModule#defaultTimeout}
     * @param {String} [config.title] Message title, default is ''
     * @param {String} [config.body] Message body, default is ''
     * @param {Boolean} [config.autoClose] Set to true to auto close notif after given or default timeout
     * @return {Notification}
     */
    NotifModule.prototype.show = function(config){
        config = config || {};
        var n = new Notification(config.title || '', {
            icon: this.defaultIcon,
            body: config.body || ''
        });
        if (config.autoClose){
            setTimeout(n.close.bind(n), this.defaultTimeout || config.timeout);
        }
        return n;
    };

    return new NotifModule();
});
/* global chrome */

define('background/state',[
    'background/msgRouter',
    'background/localStorage',
    'common/ExtMsgConstructor',
    'common/ActionsList',
    'common/NotifModule'
], function (msgRouter, ls, ExtensionMessage, ActionsList, Notif) {
    // handles clicks on 'start' popup button (it may change its caption)
    function State() {

    }
    // d is for data
    State.prototype.d = {
        started: false,
        tickets: [],
        username: ''
    };

    State.prototype.init = function () {
        if (!this.__init) {
            msgRouter.addListener(ActionsList.state.need, this.onMsgGetState.bind(this));
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

    State.prototype.startTicket = function (ticketData) {
        // {id, queue, subject} - ticketData
        if (!this.validateTicketData(ticketData)) {
            return;
        }
        this.d.tickets = this.d.tickets || [];
        var ticket, t;
        t = ticketData;


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
        Notif.show({
            title: 'Ticket started',
            body: ticket.id + ': ' + ticket.subject,
            autoClose: true
        });
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
        return this.getState();
    };

    State.prototype.broadcastUpdateState = function () {
        chrome.runtime.sendMessage(
            new ExtensionMessage({
                action: ActionsList.state.got,
                data: {
                    state: this.d
                }
            })
        );
    };

    State.prototype.restoreState = function () {
        var state = this.getState();
        if (!!state) {
            this.d = state;
        }
    };

    State.prototype.setParam = function(name, value) {
        this.d[name] = value;
        this.setState();
    };

    State.prototype.getParam = function(name) {
        return this.getState()[name];
    };

    State.prototype.setState = function() {
        ls.setItem('state', this.d);
        this.broadcastUpdateState();
    };

    State.prototype.getState = function() {
        return ls.getItem('state') || {};
    };

    return new State().init();

});


/* global chrome */

define('background/user',[
    'background/state'
], function (state) {
    function UserConstructor() {
        this.name = '';
        this.lastNameError = '';
    }

    UserConstructor.prototype.update = function (callback) {
        $.ajax({
            url: 'http://localhost:5555/user',
            success: this.onUpdateUser.bind(this, callback),
            error: this.onFailUpdateUser.bind(this, callback)
        });
    };

    UserConstructor.prototype.onUpdateUser = function (callback, response, textStatus, xhr) {
        if (!!response){
            if ( response === '' ){
                this.lastNameError = 'Empty name';
                this.name = '';
            }else{
                this.lastNameError = '';
                this.name = response;
            }
        }else{
            this.lastNameError = 'unknown error';
            this.name = '';
        }
        state.setParam('username', this.name);
        state.setParam('usernameError', this.lastNameError);
        if (callback && $.isFunction(callback)) {
            callback(response, xhr, textStatus);
        }
    };

    UserConstructor.prototype.onFailUpdateUser = function (callback, xhr, textStatus) {
        this.lastNameError = 'error: ' + xhr.status;
        this.name = '';
        state.setParam('username', '');
        state.setParam('usernameError', this.lastNameError);
        if (callback && $.isFunction(callback)) {
            callback(null, xhr, textStatus);
        }
    };

    UserConstructor.prototype.getName = function () {
        return state.getParam('username');
    };

    UserConstructor.prototype.getLastNameError = function () {
        return state.getParam('usernameError');
    };

    return new UserConstructor();
});


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
            'December'
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
        details.summary = this.sanitizeSubject(details.summary);
        var textArr = [details.key, '"' + details.summary + '"'];

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

define('background/clickHandler',[
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
                    method: 'GET',
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
            getTicketPattern: '/issue/%id%',
            debug: true,
            /**
             * Custom AJAX function, implement it yourself if wanna be jquery-independent
             */
            nonJqueryAjax: null,
            onGetTicket: function (callback, res) {
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
            parseResponse: function(ticketResponse) {
                var id, key, summary, errorText;
                var success = true;
                try {
                    id = ticketResponse.id;
                    key = ticketResponse.key;
                    summary = ticketResponse.fields.summary;

                } catch(err) {
                    success = false;
                    errorText = 'Ticket info does not contain vital info, something is wrong';
                }
                return {
                    success: success,
                    errorText: errorText,
                    ticketData: {
                        id: id,
                        key: key,
                        summary: summary
                    }
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
    'background/rt',
    'background/user',
    'common/ExtMsgConstructor',
    'common/ActionsList'
], function(record, msgRouter, state, RTConstructor, User, ExtensionMessage, ActionsList){
    msgRouter.addListener(ActionsList.content.clipboardClick, createSomethingByTicketData);
    msgRouter.addListener(ActionsList.content.startTicketClick, createSomethingByTicketData);

    msgRouter.addListener(ActionsList.content.confluenceToggleMe, getUserAndReturn);

    var RT = new RTConstructor({
        //url: 'https://www.iponweb.net/rt/REST/1.0/'
        url: 'https://jira.iponweb.net/rest/api/latest'
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


/* global chrome */

define('common/BadgeModule',[
], function(){
    /**
     * @class BadgeModule
     */
    function BadgeModule(){
        /**
         * @cfg {String}
         */
        this.defaultText = '';
        /**
         * @cfg {String}
         */
        this.defaultTitle = '';
        /**
         * @cfg {String}
         */
        this.defaultBgColor = '#6D0073'; // dark-violet
        /**
         * @cfg {String} While extension is loading or updating something inside badge
         */
        this.loadingBgColor = '#666666';
        /**
         * @cfg {String} color for "bad" things
         */
        this.finalRedColor = '#D20000'; // hue = 0
        /**
         * @cfg {String} color for "good" things
         */
        this.finalGreenColor = '#46D200'; // hue = 100
        /**
         * @cfg {String} Prefix for badge title to display detailed text of worked time
         */
        this.detailedTemplate = 'Worked/total :: ';
    }

    BadgeModule.prototype.setLoading = function(){
        this.setBadge({
            text: '...',
            title: 'Updating...',
            bgColor: this.loadingBgColor
        });
    };

    BadgeModule.prototype.setOverWorked = function(amount, detailed){
        this.setWorked(amount, detailed, this.finalGreenColor);
    };

    BadgeModule.prototype.setUnderWorked = function(amount, detailed){
        this.setWorked(amount, detailed, this.finalRedColor);
    };

    BadgeModule.prototype.setWorked = function(amount, detailed, color){
        this.setBadge({
            text: amount + '',
            title: this.detailedTemplate + detailed,
            bgColor: color
        });
    };

    /**
     * Shows notif
     * @param {Object} config
     * @param {Number} [config.text] text on badge (very limited, around 4 characters)
     * @param {String} [config.title] title which is displayed on hover
     * @param {String} [config.bgColor] a background color <b>for the badge text</b>
     */
    BadgeModule.prototype.setBadge = function(config){
        config = config || {};
        chrome.browserAction.setBadgeText({
            text: config.text || this.defaultText
        });
        chrome.browserAction.setTitle({
            title: config.title || this.defaultTitle
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: config.bgColor || this.defaultBgColor
        });
    };

    return new BadgeModule();
});
/* global chrome */

define('background/popupController',[
    'common/dates',
    'background/state',
    'background/user',
    'common/ExtMsgConstructor',
    'common/BadgeModule'
], function (Dates, state, User, ExtMessage, Badge) {
    function PopupController() {

    }

    PopupController.prototype.onStartClick = function (request, sender, sendResponse) {
        state.toggleDayStart();
        sendResponse(state.d);
    };
    PopupController.prototype.getWorkedTime = function () {
        this.worked = {
            loading: true
        };
        state.setParam('workedTime', this.worked);
        Badge.setLoading();
        User.update(
            this._sendWorkedTimeRequest.bind(this)
        );
    };

    PopupController.prototype._sendWorkedTimeRequest = function (userName) {
        //2016.07+-+July
        var timesheetUrl = 'https://confluence.iponweb.net/display/TIMESHEETS/';
        var today = new Date();
        var month = (today.getMonth() + 1);
        month = month < 10 ? '0' + month : month;
        timesheetUrl += today.getFullYear() + '.' + month + '+-+' + Dates.getMonthName(today);
        
        $.ajax({
            method: 'GET',
            url: timesheetUrl,
            timeout: 10000,
            success: this._onGetWorkedTime.bind(this, userName),
            error: this._onFailedGetWorkedTime.bind(this)
        });
    };

    PopupController.prototype._onGetWorkedTime = function (userName, res) {
        if (!res) {
            console.error('Empty worked time response');
        }
        var s, rest, absRest, total, worked, restSuffix, today, monthYearRegexp;
        s = res;
        today = new Date();
        monthYearRegexp = new RegExp('Working hours:\\s(\\d+)', 'm');
        total = s.match(monthYearRegexp);
        total = total && total.length > 0 && total[1] || 'unknown';
        worked = s.substring(s.indexOf('<th class="confluenceTh">' + userName + '</th>'))
            .split('\n').slice(0,1)[0];

        worked = worked.match(/<th class="confluenceTh">(.+?)<\/th>/g)[2];
        worked = worked.replace(/[^\d\.]/g, '');
        worked = parseFloat(worked);

        if (total && total !== 'unknown' && !isNaN(worked)) {
            rest = (total - worked).toFixed(1);
            absRest = Math.abs(rest);
            restSuffix = rest > 0 ? ('(' + absRest + 'h left)') : ('(' + absRest + 'h overworked)');
            this.workedTimeStr = worked + '/' + total + ' ' + restSuffix;
            rest = parseFloat(rest);

            this.worked = {
                worked: parseFloat(worked),
                total: parseFloat(total),
                rest: rest,
                str: this.workedTimeStr
            };

            if (rest > 0) {
                Badge.setUnderWorked('-' + absRest, this.workedTimeStr);
            } else {
                Badge.setOverWorked('+' + absRest, this.workedTimeStr);
            }

        }else{
            console.error('Error in worked time calculation, something has gone wrong');
            this.worked = {
                str: 'Error'
            };
        }
        state.setParam('workedTime', this.worked);
    };

    PopupController.prototype._onFailedGetWorkedTime = function (res) {
        this.worked = {
            worked: 0,
            total: 0,
            rest: 0,
            str: 'fail'
        };
        state.setParam('workedTime', this.worked);
        console.error('Failed to get worked time', res);
    };

    return new PopupController();
});


/* global chrome */

define('background/listenPopup',[
    'background/msgRouter',
    'background/popupController',
    'common/ActionsList'
], function(msgRouter, popupController, ActionsList){
    msgRouter.addListener(
        ActionsList.popup.startClick,
        popupController.onStartClick.bind(popupController)
    );
    msgRouter.addListener(
        ActionsList.workedTime.needUpdate,
        popupController.getWorkedTime.bind(popupController)
    );

    return {
        popupController: popupController
    };
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


/* global chrome, io */

define('background/SocketModule',[
], function(){
    function SocketModule(){
    }

    SocketModule.prototype.init = function (background) {
        var me = this;
        this.io = new io('http://127.0.0.1:5555');
        this.io.on('backend message', function (msg) {
            console.log('message: ' + msg);
            if (msg === 'submit'){
                me.onSubmitTimesheet();
            }
        });
        this.background = background;
    };

    SocketModule.prototype.onSubmitTimesheet = function(){
        try{
            this.background.onSocketMessageSubmit();
        }catch(err){

        }
    };
    return new SocketModule();
});


/**
 * This is the main JS file for background script, it is a subject to grunt's build routine.
 */

require([
    'background/user',
    'background/clickHandler',
    'background/listenContent',
    'background/listenPopup',
    'background/listenOptions',
    'background/SocketModule'
], function(User, clickHandler, listenContent, listenPopup, listenOptions, Socket){

    var bg = new BackGround();
    Socket.init(bg);
    User.update(bg.onGotName.bind(bg));

    function BackGround(){
        this.onGotName = function(a){
            console.log( 'User name: ', User.getName() || User.getLastNameError());
            listenPopup.popupController.getWorkedTime();
        };

        this.onSocketMessageSubmit = function(){
            listenPopup.popupController.getWorkedTime();
        };
    }
});

define("BackgroundMain", function(){});

