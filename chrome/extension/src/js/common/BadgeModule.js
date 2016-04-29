/* global chrome */

define([
], function(){
    /**
     * @class BadgeModule
     */
    function BadgeModule(){
        /**
         * @cfg {String}
         */
        this.defaultText = '';
        /**
         * @cfg {String}
         */
        this.defaultTitle = '';
        /**
         * @cfg {String}
         */
        this.defaultBgColor = '#6D0073'; // dark-violet
        /**
         * @cfg {String} While extension is loading or updating something inside badge
         */
        this.loadingBgColor = '#666666';
        /**
         * @cfg {String} color for "bad" things
         */
        this.finalRedColor = '#D20000'; // hue = 0
        /**
         * @cfg {String} color for "good" things
         */
        this.finalGreenColor = '#46D200'; // hue = 100
        /**
         * @cfg {String} Prefix for badge title to display detailed text of worked time
         */
        this.detailedTemplate = 'Worked/total :: ';
    }

    BadgeModule.prototype.setLoading = function(){
        this.setBadge({
            text: '...',
            title: 'Updating...',
            bgColor: this.loadingBgColor
        });
    };

    BadgeModule.prototype.setOverWorked = function(amount, detailed){
        this.setWorked(amount, detailed, this.finalGreenColor);
    };

    BadgeModule.prototype.setUnderWorked = function(amount, detailed){
        this.setWorked(amount, detailed, this.finalRedColor);
    };

    BadgeModule.prototype.setWorked = function(amount, detailed, color){
        this.setBadge({
            text: amount + '',
            title: this.detailedTemplate + detailed,
            bgColor: color
        });
    };

    /**
     * Shows notif
     * @param {Object} config
     * @param {Number} [config.text] text on badge (very limited, around 4 characters)
     * @param {String} [config.title] title which is displayed on hover
     * @param {String} [config.bgColor] a background color <b>for the badge text</b>
     */
    BadgeModule.prototype.setBadge = function(config){
        config = config || {};
        chrome.browserAction.setBadgeText({
            text: config.text || this.defaultText
        });
        chrome.browserAction.setTitle({
            title: config.title || this.defaultTitle
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: config.bgColor || this.defaultBgColor
        });
    };

    return new BadgeModule();
});