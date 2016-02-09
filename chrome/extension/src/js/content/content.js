/* global chrome */

(function(g){
    var ticketButtonsContainerId, pageTypeByUrl, addTagContainerId, addTagContainerCls, tagButtonCls, tagControlButtonCls;

    ticketButtonsContainerId = 'ts-ticket-buttons-container';
    var exportButtonId = 'ts-ext-export-btn';
    var buttonCls = 'ts-btn-container';
    var exportButtonText = 'clipboard';
    var startButtonId = 'ts-ext-start-button';
    var stopButtonId = 'ts-ext-stop-button';
    var notFound = 'unknown';
    var store = {};

    addTagContainerId = 'ts-add-tag-container-' + Math.floor((Math.random() * 10e13));
    addTagContainerCls = 'ts-add-tag-container';
    tagButtonCls = 'ts-tag-btn';
    tagControlButtonCls = 'ts-tag-control-btn';
    try{
        var d;
        d = g.document;
        pageTypeByUrl = getPageType();

        switch(pageTypeByUrl){
            case 'display':
                processDisplayPage();
                break;
            case 'modify':
                processModifyPage();
                break;
        }
        setListeners(pageTypeByUrl);

    }catch(err){
        console.error(err); // disable on prod
        // sad, but safe
    }

    function processDisplayPage(){
        if ( detectRequestTracker() ) {
            addTicketButtonsContainer();
            addDisplayPageButtons();
        }
    }
    function processModifyPage(){
        addModifyPageButtons();
    }
    /**
     * Tries to check if this page is a Reuqest Tracker page, which can be
     * a subject of this extension - if we can add a button.
     * @returns {Boolean}
     */
    function detectRequestTracker(){
        var logoEl, linkEl, bodyEl, summaryEl;

        logoEl = d.getElementById('logo');
        if (!logoEl){return false;}

        linkEl = logoEl.getElementsByTagName('a')[0];
        if (!linkEl){return false;}

        bodyEl = document.getElementById('body');
        if (!bodyEl){return false;}

        summaryEl = document.querySelector('.ticket-summary');
        if (!summaryEl){return false;}
         // enough I think
        return linkEl.getAttribute('href').match(/bestpractical/) !== null;
    }

    function getPageType(){
        var url;
        url = document.location.href;
        if (url.match(/rt\/Ticket\/Modify.html/) !== null){
            return 'modify';
        }

        if (url.match(/rt\/Ticket\/Display.html/) !== null){
            return 'display';
        }
    }

    function setListeners(pageType){
        switch (pageType){
            case 'modify':
                d.getElementById(addTagContainerId).addEventListener('click', onTagButtonClick);

                break;
            case 'display':
                chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
                var text = msg['text'];
                    if (!text || text !== "tsGetDetails") { return; }
                    var data = collectTicketData();
                    sendResponse(data);
                });
                try{
                    d.getElementById(exportButtonId).addEventListener('click', onExportButtonClick);
                    d.getElementById(startButtonId).addEventListener('click', onStartButtonClick);
                }catch(err){}

                break;
        }

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

    function addDisplayPageButtons(){
        addExportButton();
        addStartStopButtons();
    }

    function addModifyPageButtons(){
        addTagButtons();
    }

    function addTicketButtonsContainer(){
        var header, container;
        header = d.querySelectorAll('#page-navigation #page-menu')[0];

        container = d.createElement('li');
        container.setAttribute('id', ticketButtonsContainerId);
        header.insertBefore(container, header.firstChild);
    }

    function addExportButton(){
        var header, container, button;
        header = d.getElementById('header');
        container = d.getElementById(ticketButtonsContainerId);
        header = header.getElementsByTagName('h1')[0];
        // keep
        store['subject'] = header.textContent.trim().replace(/^#\d+:/gim, '').trim();
        button = d.createElement('div');
        button.setAttribute('id', exportButtonId);
        button.setAttribute('class', buttonCls);
        button.setAttribute('title', 'Form TS record and copy to clipboard');
        button.innerHTML = '<span>' + exportButtonText + '</span>';
        container.appendChild(button);
    }
    function addStartStopButtons(){
        var container, button;
        container = d.getElementById(ticketButtonsContainerId);

        button = d.createElement('div');
        button.setAttribute('id', startButtonId);
        button.setAttribute('class', buttonCls);
        button.setAttribute('title', 'Start ticket');
        button.innerHTML = '<span>' + 'start' + '</span>';
        container.appendChild(button);

        button = d.createElement('div');
        button.setAttribute('id', stopButtonId);
        button.setAttribute('class', buttonCls);
        button.setAttribute('title', 'Stop ticket');
        button.innerHTML = '<span>' + 'stop' + '</span>';
        container.appendChild(button);
    }

    function addTagButtons(){
        var tagInputContainer, buttonArea, tags;
        tagInputContainer = d.querySelectorAll('.edit-custom-fields .edit-custom-field .entry')[0];

        if (!tagInputContainer){
            return;
        }

        tags = ['CodeReview', 'SomethingElse'];
        buttonArea = d.createElement('div');
        buttonArea.setAttribute('id', addTagContainerId);
        buttonArea.setAttribute('class', addTagContainerCls);

        tags.forEach(function(tagName){
            var tagButtonOuter, tagButtonInner;
            tagButtonOuter = d.createElement('div');
            tagButtonInner = d.createElement('span');

            tagButtonOuter.setAttribute('class', tagButtonCls);
            tagButtonInner.setAttribute('data-value', tagName);
            tagButtonInner.setAttribute('data-type', 'tag');
            tagButtonInner.innerHTML = tagName;
            tagButtonOuter.appendChild(tagButtonInner);
            buttonArea.appendChild(tagButtonOuter);
        });
        tagInputContainer.appendChild(buttonArea);

        addTagControlButtons(buttonArea);
    }

    function addTagControlButtons(buttonArea){
        var tagInputContainer, controls;
        if (!buttonArea){
            return;
        }

        controls = [
            {
                name: 'clear',
                title: 'Clear'
            }
        ];

        controls.forEach(function(controlDef){
            var controlButtonOuter, controlButtonInner;
            controlButtonOuter = d.createElement('div');
            controlButtonInner = d.createElement('span');
            controlButtonOuter.setAttribute('class', tagControlButtonCls);
            controlButtonInner.setAttribute('data-value', controlDef.name);
            controlButtonInner.setAttribute('data-type', 'control');
            controlButtonInner.innerHTML = controlDef.title;
            controlButtonOuter.appendChild(controlButtonInner);
            buttonArea.insertBefore(controlButtonOuter, buttonArea.firstChild);
        });
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

    function onTagButtonClick(event){
        var tagInputContainer, tagInput, clicked, tag, btnType, btnValue;
        clicked = event.target;
        btnType = clicked && clicked.getAttribute('data-type');
        tagInputContainer = d.querySelectorAll('.edit-custom-fields .edit-custom-field .entry')[0];
        if (!tagInputContainer){
            return;
        }

        tagInput = tagInputContainer.querySelectorAll('textarea')[0];
        if (!tagInput){
            return;
        }

        switch(btnType){
            case 'tag':
                tag = clicked && clicked.getAttribute('data-value');
                if ( tagInput.value === '\n' ){
                    tagInput.value = '';
                }
                tagInput.value += tag + '\n';
                break;
            case 'control':
                btnValue = clicked && clicked.getAttribute('data-value');

                if (btnValue === 'clear'){
                    tagInput.value = '\n';
                    return;
                }

                break;
        }
    }

})(window);