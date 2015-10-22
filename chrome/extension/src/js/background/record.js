define([], function(){
    function RecordMaker(){
    }

    RecordMaker.prototype.make = function(details){
        var dateFormatted, date, month, day, endTime, startTime, hours, mins;
        var textArr = [details.id, details.queue, details.subject];

        textArr[0] = 'RT:' + textArr[0];
        textArr[2] = '"' + textArr[2] + '"';
        date = new Date();
        month = date.getMonth() + 1;
        day = date.getDate();
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;
        dateFormatted = date.getFullYear() + '-' + month + '-' + day;

        hours = date.getHours();
        mins = date.getMinutes();
        hours = hours < 10 ? '0' + hours : hours;
        mins = mins < 10 ? '0' + mins : mins;
        endTime = hours + ':' + mins;

        date.setHours(10);
        date.setMinutes(0);
        hours = date.getHours();
        mins = date.getMinutes();
        hours = hours < 10 ? '0' + hours : hours;
        mins = mins < 10 ? '0' + mins : mins;
        startTime = hours + ':' + mins;

        textArr.unshift(endTime);
        textArr.unshift(startTime);
        textArr.unshift(dateFormatted);

        textArr = textArr.join(',');

        console.log(textArr);
        this.copy(textArr);
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

    return new RecordMaker();
});