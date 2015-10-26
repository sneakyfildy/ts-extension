/* global chrome */

define([
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
