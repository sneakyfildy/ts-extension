/* global chrome */

define([
    'background/msgRouter',
    'background/localStorage'
], function(msgRouter, ls){
    // handles clicks on 'start' popup button (it may change its caption)
    function State(){

    }
    // d is for data
    State.prototype.d = {
        started: false
    };

    State.prototype.init = function(){
        if ( !this.__init ){
            msgRouter.addListener('getState', this.onMsgGetState.bind(this));
            this.restoreState();
            this.__init = true;
        }
        return this;
    };

    State.prototype.onMsgGetState = function(request, sender, sendResponse){
        sendResponse(this.getState());
    };

    /**
     *
     * @returns {Boolean} Current state after switch
     */
    State.prototype.toggleDayStart = function(){
        var d = this.d;
        if (d.started){
            d.started = false;
            d.endTime = new Date().getTime();
        }else{
             d.started = true;
             d.startTime = new Date().getTime();
        }
        this.setState();
    };

    State.prototype.restoreState = function(){
        var state = this.getState();
        if (!!state){
            this.d = state;
        }
    };

    State.prototype.setState = function(){
         ls.setItem('state', this.d);
    };
    State.prototype.getState = function(){
         return ls.getItem('state');
    };

    return new State().init();

});

