/* global module, define */
(function () {
    function moduleDefiniton() {
        /**
         * Manage RT with its REST API
         * @class RT
         * @param {Object} [cfg]
         * @param {String} [cfg.url]
         * @singleton
         */
        function RT(cfg) {

            function init() {
                this.url = cfg.url || this.url; // always put a property in instance, I wanna see it in console
                this.debug = typeof cfg.debug !== 'undefined' ? cfg.debug : this.debug;
            }

            /**
             *
             * @param {Number|String} id
             * @param {Function} [callback]
             * callback param:
             *      {
             *          success: true,
             *          ticketData: {
             *              id: "1",
             *              owner: "you"
             *          },
             *          errorText: ""
             *      }
             * @return {undefined}
             */
            this.getTicket = function (id, callback) {
                var fullUrl;
                fullUrl = this.url + this.getTicketPattern.replace('%id%', id);
                this.ajax({
                    method: 'POST',
                    url: fullUrl,
                    success: this.onGetTicket.bind(this, callback),
                    error: this.onGetTicketError.bind(this, callback)
                });
            };

            return init.call(this);
        }


        var protoStuff = {
            /**
             * @param {String}
             */
            url: 'http://rt.easter-eggs.org/demos/4.2/',
            getTicketPattern: 'ticket/%id%/show',
            debug: true,
            /**
             * Custom AJAX function, implement it yourself if wanna be jquery-independent
             */
            nonJqueryAjax: null,
            onGetTicket: function (callback, res) {debugger;
                var parsedRes = this.parseResponse(res);

                if (!parsedRes.success){
                    this.debug && console.error('Error getting ticket data: ', parsedRes.errorText || '<No error text>');
                }else if ( callback && typeof callback === 'function' ){
                    callback(parsedRes); // assuming scope and everything is bound already
                }
            },
            onGetTicketError: function (callback, res) {
                var errorText = res.statusText || '<No error text>';
                this.debug && console.error('Error getting ticket data: ', errorText, ' Status: ' + res.status);

                if ( callback && typeof callback === 'function' ){
                    callback({
                        success: false,
                        data: {},
                        errorText: errorText
                    });
                }
            },
            parseResponse: function(ticketResponse){
                var r, statusLine, emptyLine, possibleErrorLine, data, line, success, errorText;
                data = {};
                success = true;
                errorText ='';
                r = ticketResponse;
                r = r.split('\n');

                statusLine = r.shift();
                emptyLine = r.shift();
                possibleErrorLine = r[0];

                if (!statusLine || statusLine.toLowerCase().indexOf('200 ok') < 0 || emptyLine !== ''){
                    errorText = 'Something went wrong, incorrect server answer structure.';
                    success = false;
                }else if ( possibleErrorLine && possibleErrorLine.indexOf('#') === 0 ){
                    possibleErrorLine = possibleErrorLine.replace('#', '').replace(/^\s+/gim, '');
                    errorText = possibleErrorLine;
                    success = false;
                }else{
                    for (var i = 0; i < r.length; i++){
                        line = r[i];
                        if (line !== '' && !!line && line.indexOf(': ')){
                            line = line.split(': ');
                            if ( line.length >= 2 ){
                                if (line[0] === 'id'){
                                    line[1] = line[1].replace('ticket/', '');
                                }
                                data[line.shift().toLowerCase()] = line.join(':');
                            }
                        }
                    }
                }

                return {
                    success: success,
                    errorText: errorText,
                    ticketData: data
                };
            },
            ajax: function(ajaxParams){
                if (this.nonJqueryAjax){
                    return this.nonJqueryAjax(ajaxParams);
                }else{
                    return $.ajax(ajaxParams);
                }
            }
        };

        for (var stuffName in protoStuff) {
            if (typeof protoStuff[stuffName] === 'function') {
                RT.prototype[stuffName] = protoStuff[stuffName].bind(RT.prototype);
            } else {
                RT.prototype[stuffName] = protoStuff[stuffName];
            }
        }

        return RT;
    }

    if (typeof define === "function" && define.amd) {
        define([], moduleDefiniton);
    } else if (typeof module === "object" && module.exports) {
        module.exports = moduleDefiniton;
    } else {
        window['RTIConstructor'] = moduleDefiniton();
    }
})();