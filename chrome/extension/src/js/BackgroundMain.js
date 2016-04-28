/**
 * This is the main JS file for background script, it is a subject to grunt's build routine.
 */

require([
    'background/user',
    'background/clickHandler',
    'background/listenContent',
    'background/listenPopup',
    'background/listenOptions'
], function(User, clickHandler, listenContent, listenPopup, listenOptions){
    var bg = new BackGround();
    User.update(bg.onGotName.bind(bg));

    function BackGround(){
        this.onGotName = function(a){
            console.log( 'User name: ', User.getName() || User.getLastNameError());
            listenPopup.popupController.getWorkedTime();
        };
    }
});
