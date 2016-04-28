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
            gotTicketString: transform('hereIsTheTicketString')
        },
        state: {
            need: transform('generalNeedState'),
            got: transform('generalGotState')
        },
        workedTime: {
            needUpdate: transform('pleaseUpdateWorkedTime')
        }
    };

    return ActionsList;
});
/* global chrome */

define('popup/contentController',[
    'common/dates',
    'common/ActionsList',
    'common/ExtMsgConstructor'
], function (dates, ActionsList, ExtensionMessage) {
    function ContentController(){
        this.onGetState = function(state){
            this.applyState(state);
        };

        this.onStartBtnClick = function () {
            chrome.runtime.sendMessage(
                new ExtensionMessage({
                    action: ActionsList.popup.startClick,
                    data: {
                        button: this.$scope.startBtn
                    }
                }),
                this.onStartBtnResponse.bind(this)
            );
        };

        this.onUpdateWorkedTimeClick = function(){
            this.updateWorkedTime();
        };

        this.onStartBtnResponse = function(state){
            this.applyState(state);
        };

        /**
         * Base applying
         * @param {Object} state
         * @param {Boolean} started
         * @param {Number|String} startTime
         * @param {Number|String} endTime
         * @chainable
         * @returns {undefined}
         */
        this.applyState = function(state){
            for (var i in state){
                this.$scope[i] = state[i];
            }
            this.$scope.opts = state.opts || {};

            this.commitState();
            this.$scope.$apply();
            return this;
        };
        /**
         * Actions not directly affecting state (e.g. actions, which makes state params
         * be transformed into needed controller's params)
         * @returns {my}
         * @chainable
         */
        this.commitState = function(){
            var sd, ed, s;
            s = this.$scope;
            if ( this.$scope.startTime ){
                sd = new Date(this.$scope.startTime);
                this.$scope.wdStartTimeHuman = dates.getHumanTime( sd );
                this.$scope.wdStartDateHuman = dates.getHumanDate( sd );
            }
            if ( this.$scope.endTime  ){
                ed = new Date(this.$scope.endTime);
                this.$scope.wdEndTimeHuman = dates.getHumanTime( ed );
                this.$scope.wdEndDateHuman = dates.getHumanDate( ed );
            }

            this.$scope.startBtn.caption = this.$scope.started ? 'End' : 'Start';

            (this.$scope.tickets || []).forEach(function(ticket){
                var end = ticket.ended || new Date().getTime();
                if (ticket.started){
                    ticket.startTimeHuman = dates.getFullDate( new Date(+ticket.started) );
                    ticket.duration = end - +ticket.started;
                    ticket.durationHuman = Math.round( (ticket.duration / (1000 * 60)) ) + ' mins';
                }
                if (ticket.ended){
                    ticket.endTimeHuman = dates.getFullDate( new Date(+ticket.ended) );
                }
                if (s.opts.rt_link && s.opts.rt_link.value){
                    ticket.idLink = s.opts.rt_link.value+'/Ticket/Display.html?id='+ticket.id;
                }else{
                    ticket.idLink = null;
                }
            });
            return this;
        };

        this.getState = function(){
            chrome.runtime.sendMessage(
                new ExtensionMessage({
                    action: ActionsList.state.need,
                    data: ''
                }),
                this.onGetState.bind(this)
            );
        };

        this.startUpdateCurrentTime = function(){
            this.updateTimeTick();
        };

        this.updateTimeTick = function(){
            var date, prevMins, prevHours;
            date = new Date();
            prevHours = this.s.currentHours || '00';
            prevMins = this.s.currentMins || '00';

            this.s.currentHours = dates.xx( date.getHours() );
            this.s.currentMins = dates.xx( date.getMinutes() );

            var dayNameShort = dates.getDayName(date, {short: true});
            var monthNameShort = dates.getMonthName(date, {short: true});
            this.s.headerDateString = dayNameShort + ' ' + monthNameShort + ' ' + dates.xx(date.getDate());
            if ( prevMins !== this.s.currentMins || prevHours !== this.s.currentHours  ){
                this.$timeout(this.s.$apply.bind(this.$scope));
            }
            this._clockTimeout = this.$timeout(this.updateTimeTick.bind(this), 1000);
        };

        this.calculateTimezone = function(){
            var date, tzInt, tzString;
            date = new Date();
            tzInt = date.getTimezoneOffset() * - 1;
            tzString = (tzInt > 0 ? '+' : '-') + parseInt(tzInt / 60);
            this.s.timezoneHuman = tzInt === 0 ? '' : tzString;
        };

        this.setListeners = function(){
            chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
            $(document).on('click', 'a', this.onLinkClick.bind(this));
        };

        this.onMessage = function(request){
            switch(request.action){
                case ActionsList.state.got:
                    this.onGetState(request.data.state);
                    break;
            }
        };

        this.updateWorkedTime = function(){
            if (this.s.workedTime && !!this.s.workedTime.loading){
                return;
            }
            // just kindly ask CE Bg to get worked time data
            chrome.runtime.sendMessage(
                new ExtensionMessage({
                    action: ActionsList.workedTime.needUpdate,
                    data: ''
                })
            );
        };

        this.onLinkClick = function(e){
            // for some reason 'data-href' is not being processed by that weird angular thing
            var link = $(e.currentTarget).attr('data-link');
            link && this.goToLink(link);
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        this.goToLink = function goToLink(link){
            chrome.tabs.create({
                url:link
            });
        };
    }

    ContentController.prototype.controllerConstructor = function($scope, $timeout, $http){
        var my = $scope;
        this.$scope = this.scope = this.s = $scope;
        this.$timeout = $timeout;
        this.$http = $http;
        this.getState();
        this.calculateTimezone();
        this.startUpdateCurrentTime();
        this.setListeners();


        my.startBtn = {
            caption: 'Start',
            onClick: this.onStartBtnClick.bind(this)
        };

        my.updateWorkedBtn = {
            caption: 'Update Hours',
            onClick: this.onUpdateWorkedTimeClick.bind(this)
        };
    };

    return new ContentController();
});

/* global angular */

define('popup/popAppModule',['popup/contentController'], function(contentController){
    var popApp = angular.module('popApp', []);
    popApp.controller('contentController', ['$scope', '$timeout', '$http', contentController.controllerConstructor.bind(contentController)]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, ['popApp']);
    });
});
/**
 * This is the main JS file for popup script, it is a subject to grunt's build routine.
 */

require([
    'popup/popAppModule'
], function(){
});

define("PopupMain", function(){});

