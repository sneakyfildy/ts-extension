/* global chrome, io */

define([
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

