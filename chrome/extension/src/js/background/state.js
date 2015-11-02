/* global chrome */

define([
    'background/msgRouter',
    'background/localStorage'
], function (msgRouter, ls) {
    // handles clicks on 'start' popup button (it may change its caption)
    function State() {

    }
    // d is for data
    State.prototype.d = {
        started: false,
        tickets: []
    };

    State.prototype.init = function () {
        if (!this.__init) {
            msgRouter.addListener('getState', this.onMsgGetState.bind(this));
            this.restoreState();
            this.__init = true;
        }
        return this;
    };

    State.prototype.onMsgGetState = function (request, sender, sendResponse) {
        sendResponse(this.getState());
    };

    /**
     *
     * @returns {Boolean} Current state after switch
     */
    State.prototype.toggleDayStart = function () {
        var d = this.d;
        if (d.started) {
            d.started = false;
            d.endTime = new Date().getTime();
        } else {
            d.started = true;
            d.startTime = new Date().getTime();
        }
        this.setState();
    };

    State.prototype.startTicket = function (contentPageData) {
        if (!this.validateTicketData(contentPageData)) {
            return;
        }
        this.d.tickets = this.d.tickets || [];
        var ticket, t;
        t = contentPageData;


        // we'll start with having only one active ticket
        /*
         ticket = this.getTicketById(t.id);
         if (ticket){
            ticket.started = new Date().getTime();
         }else{
         ticket = {
            id: t.id,
            subject: t.subject,
            queue: t.queue,
            started: new Date().getTime()
         };
         this.d.tickets.push(ticket);
         }
         */

        // implementation of single-ticket approach
        this.d.tickets = []; // drop everything
        ticket = {
            id: t.id,
            subject: t.subject,
            queue: t.queue,
            started: new Date().getTime()
        };
        this.d.tickets.push(ticket);

        this.setState();
        this.broadcastUpdateState();

        var n = new Notification('Ticket started', {
            icon: 'img/icon48.png',
            body: ticket.id + ': ' + ticket.subject
        });
        setTimeout(n.close.bind(n), 3000);
        return ticket;
    };

    State.prototype.validateTicketData = function (data) {
        return data.id && data.queue && data.subject;
    };

    State.prototype.getTicketById = function (id) {
        this.d.tickets = this.d.tickets || [];
        return this.d.tickets.filter(function (item) {
            return item.id === id;
        })[0];
    };
    /**
     *
     * @param {Object} opts
     * @returns {Object} State
     */
    State.prototype.setOptions = function (opts) {
        var d = this.d;
        opts = opts || opts;
        this.d.opts = opts;
        
        this.setState();
        this.broadcastUpdateState();

        return this.getState();
    };

    State.prototype.broadcastUpdateState = function () {
        chrome.runtime.sendMessage(
            {action: 'ts_ext_updateState', state: this.d}
        );
    };

    State.prototype.restoreState = function () {
        var state = this.getState();
        if (!!state) {
            this.d = state;
        }
    };

    State.prototype.setState = function () {
        ls.setItem('state', this.d);
    };

    State.prototype.getState = function () {
        return ls.getItem('state') || {};
    };

    return new State().init();

});

