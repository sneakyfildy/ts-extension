define([
    'common/dates'
], function(dates){
    function DetectorClass(){

        /**
         * Tries to check if this page is a Reuqest Tracker page, which can be
         * a subject of this extension - if we can add a button.
         * @returns {Boolean}
         */
        this.detectRequestTracker = function(){
            var url;
            url = document.location.href;
            return url.match(/rt\/Ticket\/Modify.html/) !== null || url.match(/rt\/Ticket\/Display.html/) !== null;
        };

        this.getPageType = function(){
            var url;
            url = document.location.href;
            if (url.match(/rt\/Ticket\/Modify.html/) !== null){
                return 'MODIFY_PAGE';
            }

            if (url.match(/rt\/Ticket\/Display.html/) !== null){
                return 'DISPLAY_PAGE';
            }
        };

        /**
         * Function to detect if there's an ability to add main control buttons
         * @returns {Boolean}
         */
        this.canAddMainControls = function(){
            var check = document.querySelectorAll('#page-navigation #page-menu')[0];
            return !!check;
        };

        this.isConfluenceMonthPage = function(){
            var url, timesheetConfluenseUrl, regex;
            url = document.location.href;
            timesheetConfluenseUrl = 'https://confluence.iponweb.net/display/TIMESHEETS/';
            // https://confluence.iponweb.net/display/TIMESHEETS/2016.07+-+July
            if (url.indexOf(timesheetConfluenseUrl) === 0){
                url = url.replace(timesheetConfluenseUrl, '');
                if (url.length === 0){
                    return false;
                }else{
                    regex = '\\d\\d\\d\\d\\.\\d\\d.*(' + dates.months.full.join('|') + ')';
                    regex = new RegExp(regex, 'gim');
                    return url.match(regex) !== null;
                }
            }else{
                return false;
            }
        };
    }


    return new DetectorClass();
});