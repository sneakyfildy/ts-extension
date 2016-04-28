/**
 * This is the main JS file for background script, it is a subject to grunt's build routine.
 */

require([
    'background/user',
    'background/clickHandler',
    'background/listenContent',
    'background/listenPopup',
    'background/listenOptions'
], function(User){
    var bg = new BackGround();
    User.update(bg.logName.bind(bg));

    function BackGround(){
        this.logName = function(a){
            console.log( 'User name: ', User.getName() || User.getLastNameError());
        };
    }
});
