define([], function(){
    function DebugLoggerConstructor(){
        this.enabled = false;
        this.on = function(){
            this.enabled = true;
        };
        this.off = function(){
            this.enabled = false;
        };
        this.log = function(anything){
            if (!!this.enabled){
                console.log('debug log', anything);
            }
        };
    }

    return DebugLoggerConstructor;
});