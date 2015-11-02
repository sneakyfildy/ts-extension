/* global chrome */

define([
    'common/dates'
], function (dates) {
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
                {action: 'ts_ext_getState'},
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
                case 'ts_ext_updateState':
                    this.onGetState(request.state);
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
