define([
], function(){
    function ExtMsgConstructor(config){
        if (!config.action || !config.data){
            throw 'Action and data properties are required';
        }

        this.action = config.action;
        this.data = config.data;

        if (this.action.indexOf(this.actionPrefix) < 0){
            this.action = this.addPrefix(this.action);
        }
    }
    ExtMsgConstructor.prototype.actionPrefix = 'ts_ext_';
    ExtMsgConstructor.prototype.addPrefix = function(sourceStr){
        var readyAction = sourceStr;
        if (sourceStr.indexOf(this.actionPrefix) < 0){
            readyAction = this.actionPrefix + sourceStr;
        }
        return readyAction;
    };

    return ExtMsgConstructor;
});