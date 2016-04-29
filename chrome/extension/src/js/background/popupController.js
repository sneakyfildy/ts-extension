/* global chrome */

define([
    'common/dates',
    'background/state',
    'background/user',
    'common/ExtMsgConstructor',
    'common/BadgeModule'
], function (Dates, state, User, ExtMessage, Badge) {
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
        Badge.setLoading();
        User.update(
            this._sendWorkedTimeRequest.bind(this)
        );
    };

    PopupController.prototype._sendWorkedTimeRequest = function (userName) {
        var timesheetUrl = 'https://www.iponweb.net/twiki/bin/view/IPonweb/Timesheet';
        var today = new Date();
        timesheetUrl += Dates.getMonthName(today) + today.getFullYear();
        $.ajax({
            method: 'GET',
            url: timesheetUrl,
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
        var s, rest, total, worked, restSuffix;
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
            restSuffix = rest > 0 ? ('(' + rest.toFixed(1) + 'h left)') : ('(' + rest + 'h overworked)');
            this.workedTimeStr = worked + '/' + total + ' ' + restSuffix;
            rest = parseFloat( rest.toFixed(1) );

            if (rest > 0) {
                Badge.setUnderWorked('-' + rest, this.workedTimeStr);
            } else {
                Badge.setOverWorked('+' + rest, this.workedTimeStr);
            }
            this.worked = {
                worked: parseFloat(worked),
                total: parseFloat(total),
                rest: rest,
                str: this.workedTimeStr
            };
        }else{
            console.error('Error in worked time calculation, something has gone wrong');
            this.worked = {
                str: 'Error'
            };
        }
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

