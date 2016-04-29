/* global chrome */

define([
    'background/state',
    'background/user',
    'common/ExtMsgConstructor'
], function (state, User, ExtMessage) {
    function PopupController() {

    }

    PopupController.prototype.onStartClick = function (request, sender, sendResponse) {
        state.toggleDayStart();
        sendResponse(state.d);
    };
    PopupController.prototype.getWorkedTime = function () {
        this.worked = {
            loading: true
        };
        state.setParam('workedTime', this.worked);
        chrome.browserAction.setBadgeText({
            text: '...'
        });
        chrome.browserAction.setTitle({
            title: 'Updating...'
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: '#666666'
        });
        User.update(
            this._sendWorkedTimeRequest.bind(this)
        );
    };

    PopupController.prototype._sendWorkedTimeRequest = function (userName) {
        var request = $.ajax({
            method: 'GET',
            url: 'https://www.iponweb.net/twiki/bin/view/IPonweb/TimesheetApril2016',
            timeout: 10000,
            success: this._onGetWorkedTime.bind(this, userName),
            error: this._onFailedGetWorkedTime.bind(this)
        });
    };

    PopupController.prototype._onGetWorkedTime = function (userName, res) {
        if (!res) {
            console.error('Empty worked time response');
        }
        //April2016 (Working hours - 168)
        var s, rest, total, worked, color, restString;
        s = res;
        total = s.match(/April2016 \(Working hours - (\d+)\)/);
        total = total && total.length > 0 && total[1] || 'unknown';
        worked = s
            .substring(s.indexOf(userName)) // to reduce length and set starting point for an array
            .split('\n')
            .splice(0, 3)[2];
        worked = worked.replace(/\s\s+|<td\s.+?>|<\/td>/gim, '').replace(/\s/gim, '');
        worked = parseFloat(worked);

        if (total && total !== 'unknown' && !isNaN(worked)) {
            rest = total - worked;
            if (rest > 0) {
                color = '#DF0500';
                restString = '(' + rest.toFixed(1) + 'h left)';
                rest = '-' + rest.toFixed(1);
            } else {
                color = '#00910D';
                rest = rest.toFixed(1);
                restString = '(' + rest + 'h overworked)';
            }
        }
        this.workedTimeStr = worked + '/' + total + ' ' + restString;
        this.worked = {
            worked: parseFloat(worked),
            total: parseFloat(total),
            rest: parseFloat(rest),
            str: this.workedTimeStr
        };

        chrome.browserAction.setBadgeText({
            text: String(rest)
        });
        chrome.browserAction.setTitle({
            title: 'Worked/total :: ' + this.workedTimeStr
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: color
        });
        state.setParam('workedTime', this.worked);
    };

    PopupController.prototype._onFailedGetWorkedTime = function (res) {
        this.worked = {
            worked: 0,
            total: 0,
            rest: 0,
            str: 'fail'
        };
        state.setParam('workedTime', this.worked);
        console.error('Failed to get worked time', res);
    };

    return new PopupController();
});

