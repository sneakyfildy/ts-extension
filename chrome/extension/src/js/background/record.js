define([
    'common/dates'
], function(dates){
    function RecordMaker(){
    }

    RecordMaker.prototype.make = function(details){
        var dateFormatted, date, month, day, endTime, startTime, hours, mins;
        details.subject = this.sanitizeSubject(details.subject);
        var textArr = [details.queue, details.id, details.subject];

        textArr[1] = 'RT:' + textArr[1];
        textArr[2] = '"' + textArr[2] + '"';
        date = new Date();
        dateFormatted = dates.getHumanDate(date);

        endTime = dates.getHumanTime(date);

        date.setHours(10);
        date.setMinutes(0);

        startTime = dates.getHumanTime(date);

        textArr.unshift(endTime);
        textArr.unshift(startTime);
        textArr.unshift(dateFormatted);

        textArr = textArr.join(',');

        this.copy(textArr);
        return textArr;
    };

    RecordMaker.prototype.copy = function(text){
        var copyDiv = document.createElement('div');
        copyDiv.contentEditable = true;
        document.body.appendChild(copyDiv);
        copyDiv.innerHTML = text;
        copyDiv.unselectable = "off";
        copyDiv.focus();
        document.execCommand('SelectAll');
        document.execCommand("Copy", false, null);
        document.body.removeChild(copyDiv);
    };

    RecordMaker.prototype.sanitizeSubject = function(before){
        var after;

        after = before.replace(/"/gim, '\'');
        return after;
    };

    return new RecordMaker();
});