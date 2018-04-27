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
                    method: 'GET',
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
            getTicketPattern: '/issue/%id%',
            debug: true,
            /**
             * Custom AJAX function, implement it yourself if wanna be jquery-independent
             */
            nonJqueryAjax: null,
            onGetTicket: function (callback, res) {
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
            parseResponse: function(ticketResponse) {
                var id, key, summary, errorText;
                var success = true;
                try {
                    id = ticketResponse.id;
                    key = ticketResponse.key;
                    summary = ticketResponse.fields.summary;

                } catch(err) {
                    success = false;
                    errorText = 'Ticket info does not contain vital info, something is wrong';
                }
                return {
                    success: success,
                    errorText: errorText,
                    ticketData: {
                        id: id,
                        key: key,
                        summary: summary
                    }
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