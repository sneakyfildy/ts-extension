/* global chrome */

define([
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
