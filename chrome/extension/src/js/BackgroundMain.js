/**
 * This is the main JS file for background script, it is a subject to grunt's build routine.
 */

require([
    'background/user',
    'background/clickHandler',
    'background/listenContent',
    'background/listenPopup',
    'background/listenOptions',
    'background/SocketModule'
], function(User, clickHandler, listenContent, listenPopup, listenOptions, Socket){

    var bg = new BackGround();
    Socket.init(bg);
    User.update(bg.onGotName.bind(bg));

    function BackGround(){
        this.onGotName = function(a){
            console.log( 'User name: ', User.getName() || User.getLastNameError());
            listenPopup.popupController.getWorkedTime();
        };

        this.onSocketMessageSubmit = function(){
            listenPopup.popupController.getWorkedTime();
        };
    }
});
