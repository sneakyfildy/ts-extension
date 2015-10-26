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


/* global chrome */

define('popup/contentController',[
    'common/dates'
], function (dates) {
    function contentController($scope) {
        var my = $scope;
        my.startBtn = {
            caption: 'Start',
            onClick: function () {
                console.log(new Date());
                chrome.runtime.sendMessage(
                    {action: 'ts_ext_popupStartButton', button: my.startBtn},
                    onStartBtnResponse
                );
            }
        };

        chrome.runtime.sendMessage(
            {action: 'ts_ext_getState'},
            onGetState
        );

        function onGetState(state){
            my.applyState(state);
        }

        function onStartBtnResponse(state){
            my.applyState(state);
        }
        /**
         * Base applying
         * @param {Object} state
         * @param {Boolean} started
         * @param {Number|String} startTime
         * @param {Number|String} endTime
         * @chainable
         * @returns {undefined}
         */
        my.applyState = function(state){
            my.started = state.started;
            my.startTime = state.startTime;
            my.endTime = state.endTime;

            my.commitState();
            my.$apply();
            return my;
        };
        /**
         * Actions not directly affecting state (e.g. actions, which makes state params
         * be transformed into needed controller's params)
         * @returns {my}
         * @chainable
         */
        my.commitState = function(){
            my.startTimeHuman = dates.getFullDate( new Date(my.startTime) );
            my.endTimeHuman = dates.getFullDate( new Date(my.endTime) );

            my.startBtn.caption = my.started ? 'End' : 'Start';
            return my;
        };
    }

    return contentController;
});

/* global angular */

define('popup/popAppModule',['popup/contentController'], function(contentControllerFn){
    var popApp = angular.module('popApp', []);
    popApp.controller('contentController', ['$scope', contentControllerFn]);

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

