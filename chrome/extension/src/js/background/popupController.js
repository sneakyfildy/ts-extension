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
        //2016.07+-+July
        var timesheetUrl = 'https://confluence.iponweb.net/display/TIMESHEETS/';
        var today = new Date();
        var month = (today.getMonth() + 1);
        month = month < 10 ? '0' + month : month;
        timesheetUrl += today.getFullYear() + '.' + month + '+-+' + Dates.getMonthName(today);
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
        //Working hours: 168
        var s, rest, absRest, total, worked, restSuffix, today, monthYearRegexp;
        s = res;
        today = new Date();
        monthYearRegexp = new RegExp('Working hours:\\s(\\d+)', 'm');
        total = s.match(monthYearRegexp);
        total = total && total.length > 0 && total[1] || 'unknown';
        worked = s
            .substring(s.indexOf('<th class="confluenceTh">' + userName + '</th>')) // to reduce length and set starting point for an array
            .split('\n')
            .splice(0, 3)[2];
        worked = worked.replace(/\s\s+|<th\s.+?>|<\/th>/gim, '').replace(/\s/gim, '');
        worked = worked.replace(/&nbsp;/g, '0');
        worked = parseFloat(worked);

        if (total && total !== 'unknown' && !isNaN(worked)) {
            rest = (total - worked).toFixed(1);
            absRest = Math.abs(rest);
            restSuffix = rest > 0 ? ('(' + absRest + 'h left)') : ('(' + absRest + 'h overworked)');
            this.workedTimeStr = worked + '/' + total + ' ' + restSuffix;
            rest = parseFloat(rest);

            this.worked = {
                worked: parseFloat(worked),
                total: parseFloat(total),
                rest: rest,
                str: this.workedTimeStr
            };

            if (rest > 0) {
                Badge.setUnderWorked('-' + absRest, this.workedTimeStr);
            } else {
                Badge.setOverWorked('+' + absRest, this.workedTimeStr);
            }

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

