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


/* global chrome */

define('options/optionsController',[
    'common/dates'
], function (dates) {
    function OptionsController(){
        this.onGetState = function(state){
            this.applyState(state);
        };

        this.onStartBtnClick = function () {
            console.log(new Date());
            chrome.runtime.sendMessage(
                {action: 'ts_ext_popupStartButton', button: this.$scope.startBtn},
                this.onStartBtnResponse.bind(this)
            );
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
            this.$scope.opts = {
                rt_link: {
                    name: 'rt_link',
                    value: void(0)
                }
            };


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
                {action: 'ts_ext_getState'},
                this.onGetState.bind(this)
            );
        };

        this.setListeners = function(){
            chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
        };

        this.onMessage = function(request){
            switch(request.action){
                case 'ts_ext_updateState':
                    this.onGetState(request.state);
                    break;
            }
        };
    }

    OptionsController.prototype.controllerConstructor = function($scope){
        var my = $scope;
        this.$scope = this.scope = this.s = $scope;
        this.getState();

        my.content = 'content';
        my.startBtn = {
            caption: 'Start',
            onClick: this.onStartBtnClick.bind(this)
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

