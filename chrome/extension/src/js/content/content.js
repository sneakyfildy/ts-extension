/* global chrome */

(function(g){
    var buttonId = 'ts-btn-container';
    var buttonText = '+';
    var notFound = 'unknown';
    var store = {};
    try{
        var d;
        d = g.document;

        if ( detectRequestTracker() ) {
            addButton();
            setListeners();
        }
    }catch(err){
        console.error(err); // disable on prod
        // sad, but safe
    }
    /**
     * Tries to check if this page is a Reuqest Tracker page, which can be
     * a subject of this extension - if we can add a button.
     * @returns {Boolean}
     */
    function detectRequestTracker(){
        var logoEl, linkEl;
        logoEl = d.getElementById('logo');
        if (!logoEl){return false;}
        linkEl = logoEl.getElementsByTagName('a')[0];
        if (!linkEl){return false;}
         // enough I think
        return linkEl.getAttribute('href').match(/bestpractical/) !== null;
    }

    function setListeners(){
        chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
            var text = msg['text'];
            if (!text || text !== "tsGetDetails") { return; }
            var data = collectTicketData();
            sendResponse(data);
        });

         d.getElementById(buttonId).addEventListener('click', onButtonClick);
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

    function addButton(){
        var header, button;
        header = d.getElementById('header');
        header = header.getElementsByTagName('h1')[0];
        // keep
        store['subject'] = header.textContent.trim().replace(/^#\d+:/gim, '').trim();
        button = d.createElement('div');
        button.setAttribute('id', buttonId);
        button.setAttribute('title', 'Form TS record and copy to clipboard');
        button.innerHTML = '<span>' + buttonText + '</span>';
        header.appendChild(button);
    }

    function onButtonClick(){
        var data = collectTicketData() || {};
        data.action = 'ts_ext_ticketDetails';
        chrome.runtime.sendMessage(data, function(response) {
            // handle response?
        });
    }

})(window);