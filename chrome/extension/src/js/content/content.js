/* global chrome */

(function(g){
    var exportButtonId = 'ts-ext-export-btn';
    var buttonCls = 'ts-btn-container';
    var exportButtonText = '+';
    var startButtonId = 'ts-ext-start-button';
    var stopButtonId = 'ts-ext-stop-button';
    var notFound = 'unknown';
    var store = {};
    try{
        var d;
        d = g.document;

        addButtons();
        setListeners();

    }catch(err){
        console.error(err); // disable on prod
        // sad, but safe
    }
    /**
     * Tries to check if this page is a Reuqest Tracker page, which can be
     * a subject of this extension - if we can add a button.
     * @returns {Boolean}
     */
    function setListeners(){
        chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
            var text = msg['text'];
            if (!text || text !== "tsGetDetails") { return; }
            var data = collectTicketData();
            sendResponse(data);
        });

        d.getElementById(exportButtonId).addEventListener('click', onExportButtonClick);
        d.getElementById(startButtonId).addEventListener('click', onStartButtonClick);
    }

    function collectTicketData(){
        var data = {};
        // id
        data['id'] = collectParam('id');
        // queue
        data['queue'] = collectParam('queue');
        // subject
        data['subject'] = store['subject'] || notFound;
        return data;
    }

    function collectParam(className){
        var el = d.querySelector('.' + className + ' .value');
        return !el ? notFound : (el.textContent || notFound).replace(/[\s\t\n]/gim, '');
    }

    function addButtons(){
        addExportButton();
        addStartStopButtons();
    }
    function addExportButton(){
        var header, button;
        header = d.getElementById('header');
        header = header.getElementsByTagName('h1')[0];
        // keep
        store['subject'] = header.textContent.trim().replace(/^#\d+:/gim, '').trim();
        button = d.createElement('div');
        button.setAttribute('id', exportButtonId);
        button.setAttribute('class', buttonCls);
        button.setAttribute('title', 'Form TS record and copy to clipboard');
        button.innerHTML = '<span>' + exportButtonText + '</span>';
        header.appendChild(button);
    }
    function addStartStopButtons(){
        var header, button;
        header = d.getElementById('header');
        header = header.getElementsByTagName('h1')[0];

        button = d.createElement('div');
        button.setAttribute('id', startButtonId);
        button.setAttribute('class', buttonCls);
        button.setAttribute('title', 'Start ticket');
        button.innerHTML = '<span>' + 'start' + '</span>';
        header.appendChild(button);

        button = d.createElement('div');
        button.setAttribute('id', stopButtonId);
        button.setAttribute('class', buttonCls);
        button.setAttribute('title', 'Stop ticket');
        button.innerHTML = '<span>' + 'stop' + '</span>';
        header.appendChild(button);
    }
    function onExportButtonClick(){
        var data = collectTicketData() || {};
        data.action = 'ts_ext_ticketDetails';
        chrome.runtime.sendMessage(data, function(recordString) {
            console.log(recordString);
        });
    }

    function onStartButtonClick(){
        var data = collectTicketData() || {};
        data.action = 'ts_ext_startTicket';
        chrome.runtime.sendMessage(data, function(answer) {
            console.log(answer);
        });
    }

})(window);