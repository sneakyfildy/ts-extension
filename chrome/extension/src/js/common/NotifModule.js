define([
], function(){
    /**
     * @class NotifModule
     * @param {Object} config
     */
    function NotifModule(config){
        config = config || {};
        /**
         * @cfg {Number} milliseconds to autoclose
         */
        this.defaultTimeout = config.timeout || 3000;
        /**
         * @cfg {String} path to icon
         */
        this.defaultIcon = config.icon || 'img/icon48.png';
    }

    /**
     * Shows notif
     * @param {Object} config
     * @param {Number} [config.timeout] milliseconds to autoclose,
     * if undefined - {@link NotifModule#defaultTimeout}
     * @param {String} [config.title] Message title, default is ''
     * @param {String} [config.body] Message body, default is ''
     * @param {Boolean} [config.autoClose] Set to true to auto close notif after given or default timeout
     * @return {Notification}
     */
    NotifModule.prototype.show = function(config){
        config = config || {};
        var n = new Notification(config.title || '', {
            icon: this.defaultIcon,
            body: config.body || ''
        });
        if (config.autoClose){
            setTimeout(n.close.bind(n), this.defaultTimeout || config.timeout);
        }
        return n;
    };

    return new NotifModule();
});