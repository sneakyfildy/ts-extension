/* global chrome */

define([
    'background/msgRouter',
    'background/localStorage',
    'common/ExtMsgConstructor',
    'common/ActionsList',
    'common/NotifModule'
], function (msgRouter, ls, ExtensionMessage, ActionsList, Notif) {
    // handles clicks on 'start' popup button (it may change its caption)
    function State() {

    }
    // d is for data
    State.prototype.d = {
        started: false,
        tickets: [],
        username: ''
    };

    State.prototype.init = function () {
        if (!this.__init) {
            msgRouter.addListener(ActionsList.state.need, this.onMsgGetState.bind(this));
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

    State.prototype.startTicket = function (ticketData) {
        // {id, queue, subject} - ticketData
        if (!this.validateTicketData(ticketData)) {
            return;
        }
        this.d.tickets = this.d.tickets || [];
        var ticket, t;
        t = ticketData;


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
        Notif.show({
            title: 'Ticket started',
            body: ticket.id + ': ' + ticket.subject,
            autoClose: true
        });
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
        return this.getState();
    };

    State.prototype.broadcastUpdateState = function () {
        chrome.runtime.sendMessage(
            new ExtensionMessage({
                action: ActionsList.state.got,
                data: {
                    state: this.d
                }
            })
        );
    };

    State.prototype.restoreState = function () {
        var state = this.getState();
        if (!!state) {
            this.d = state;
        }
    };

    State.prototype.setParam = function(name, value) {
        this.d[name] = value;
        this.setState();
    };

    State.prototype.getParam = function(name) {
        return this.getState()[name];
    };

    State.prototype.setState = function() {
        ls.setItem('state', this.d);
        this.broadcastUpdateState();
    };

    State.prototype.getState = function() {
        return ls.getItem('state') || {};
    };

    return new State().init();

});

