/* global chrome */

define([
    'common/dates'
], function (dates) {
    function ContentController(){
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
            this.$scope.started = state.started;
            this.$scope.startTime = state.startTime;
            this.$scope.endTime = state.endTime;
            this.$scope.tickets = state.tickets;

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
            this.$scope.startTimeHuman = dates.getFullDate( new Date(this.$scope.startTime) );
            this.$scope.endTimeHuman = dates.getFullDate( new Date(this.$scope.endTime) );

            this.$scope.startBtn.caption = this.$scope.started ? 'End' : 'Start';

            this.$scope.tickets.forEach(function(ticket){
                var end = ticket.ended || new Date().getTime();
                if (ticket.started){
                    ticket.startTimeHuman = dates.getFullDate( new Date(+ticket.started) );
                    ticket.duration = end - +ticket.started;
                    ticket.durationHuman = Math.round( (ticket.duration / (1000 * 60)) ) + ' mins';
                }
                if (ticket.ended){
                    ticket.endTimeHuman = dates.getFullDate( new Date(+ticket.ended) );
                }
            });
            return this;
        };

        this.getState = function(){
            chrome.runtime.sendMessage(
                {action: 'ts_ext_getState'},
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

            this.s.dayNameFull = dates.getDayName(date);
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
        };

        this.onMessage = function(request){
            switch(request.action){
                case 'ts_ext_updateState':
                    this.onGetState(request.state);
                    break;
            }
        };
    }

    ContentController.prototype.controllerConstructor = function($scope, $timeout){
        var my = $scope;
        this.$scope = this.scope = this.s = $scope;
        this.$timeout = $timeout;
        this.getState();
        this.calculateTimezone();
        this.startUpdateCurrentTime();
        this.setListeners();


        my.startBtn = {
            caption: 'Start',
            onClick: this.onStartBtnClick.bind(this)
        };
    };

    return new ContentController();
});
