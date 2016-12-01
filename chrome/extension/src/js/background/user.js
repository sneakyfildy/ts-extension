/* global chrome */

define([
    'background/state'
], function (state) {
    function UserConstructor() {
        this.name = '';
        this.lastNameError = '';
    }

    UserConstructor.prototype.update = function (callback) {
        $.ajax({
            url: 'http://localhost:5555/user',
            success: this.onUpdateUser.bind(this, callback),
            error: this.onFailUpdateUser.bind(this, callback)
        });
    };

    UserConstructor.prototype.onUpdateUser = function (callback, response, textStatus, xhr) {
        if (!!response){
            if ( response === '' ){
                this.lastNameError = 'Empty name';
                this.name = '';
            }else{
                this.lastNameError = '';
                this.name = response;
            }
        }else{
            this.lastNameError = 'unknown error';
            this.name = '';
        }
        state.setParam('username', this.name);
        state.setParam('usernameError', this.lastNameError);
        if (callback && $.isFunction(callback)) {
            callback(response, xhr, textStatus);
        }
    };

    UserConstructor.prototype.onFailUpdateUser = function (callback, xhr, textStatus) {
        this.lastNameError = 'error: ' + xhr.status;
        this.name = '';
        state.setParam('username', '');
        state.setParam('usernameError', this.lastNameError);
        if (callback && $.isFunction(callback)) {
            callback(null, xhr, textStatus);
        }
    };

    UserConstructor.prototype.getName = function () {
        return state.getParam('username');
    };

    UserConstructor.prototype.getLastNameError = function () {
        return state.getParam('usernameError');
    };

    return new UserConstructor();
});

