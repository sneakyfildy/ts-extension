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
/* global chrome */

define('options/optionsController',[
    'common/dates',
    'common/ActionsList',
    'common/ExtMsgConstructor'
], function (dates, ActionsList, ExtensionMessage) {
    function OptionsController(){
        this.onGetState = function(state){
            this.applyState(state);
        };

        this.onSaveBtnClick = function () {
            this.$scope.opts = this.$scope.opts || {};
            var $fields = $('.options-field');
            var me = this;
            $fields.each(function(){
               var $field = $(this);
               var fieldName = $field.attr('data-fieldname');
               var fieldValue;
               if (fieldName && me.$scope.opts[fieldName]){
                   fieldValue = $field.val();
                   switch(fieldName){
                       // string -> vars
                       case 'rt_link':
                           fieldValue = fieldValue.replace(/\/+$/, ''); // strip last slash(es)
                           if ( fieldValue && !fieldValue.match(/^https{0,1}:\/\//)){
                               fieldValue = 'http://' + fieldValue;
                           }
                           break;
                   }
                   me.$scope.opts[fieldName] = me.$scope.opts[fieldName] || {};
                   me.$scope.opts[fieldName].value = fieldValue;
               }
            });
            console.log(this.$scope.opts);
            this.setOptions();
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
            var defaultOpts = {
                rt_link: {
                    name: 'rt_link',
                    value: void(0)
                }
            };
            this.$scope.opts = state.opts || defaultOpts;

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
        this.setOptions = function(){
            // there will be 'updateState' broadcast from background after saving
            // that's why no callback here
            chrome.runtime.sendMessage(
                {action: 'ts_ext_setOptions', opts: this.$scope.opts}
            );
        };
        this.setListeners = function(){
            chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
        };

        this.onMessage = function(request){
            switch(request.action){
                case ActionsList.state.got:
                    this.onGetState(request.data.state);
                    break;
            }
        };
    }

    OptionsController.prototype.controllerConstructor = function($scope){
        var my = $scope;
        this.$scope = this.scope = this.s = $scope;
        this.setListeners();
        this.getState();

        my.content = 'content';
        my.saveBtn = {
            onClick: this.onSaveBtnClick.bind(this)
        };
    };

    return new OptionsController();
});

/* global angular */

define('options/optsAppModule',['options/optionsController'], function(optionsController){
    var popApp = angular.module('optsApp', []);
    popApp.controller('optionsController', ['$scope',optionsController.controllerConstructor.bind(optionsController)]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, ['optsApp']);
    });
});
/**
 * This is the main JS file for options script, it is a subject to grunt's build routine.
 */

require([
    'options/optsAppModule'
], function(){
});

define("OptionsMain", function(){});

