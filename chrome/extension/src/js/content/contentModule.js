define([
    'common/DebugLoggerConstructor',
    'content/ContentScriptController',
    'content/Detector'
], function(DebugLoggerConstructor, ContentController, Detector){
    var Debug = new DebugLoggerConstructor();
    Debug.on();

    var Content = new ContentController({
        Debug: Debug
    });

    var d, displayPageCfg, modifyPageCfg, buttonCls;

    d = window.document;

    displayPageCfg = {
        buttons: [
            {
                innerHTML: '<span>clipboard</span>',
                id: Content.id('clipboard-btn'),
                //cls: buttonCls,
                title: 'Form TS record and copy to clipboard',
                listener: Content.onExportButtonClick
            },
            {
                id: Content.id('start-btn'),
                //cls: buttonCls,
                title: 'Start ticket',
                innerHTML: '<span>start</span>'
            },
            {
                id: Content.id('stop-btn'),
                //cls: buttonCls,
                title: 'Stop ticket',
                innerHTML: '<span>' + 'stop' + '</span>'
            }
        ],
        processingFn: function(){
            var container;
            if ( Detector.detectRequestTracker() ) {
                container = addTicketButtonsContainer();
                Content.addButtons(container);
            }
        }
    };

    modifyPageCfg = {
        buttons: [],
        processingFn: function(){
            if ( Detector.detectRequestTracker() ) {
                Content.addTagButtons();
            }
        }
    };

    var PAGE_CONFIGS = {
        DISPLAY_PAGE: displayPageCfg,
        MODIFY_PAGE: modifyPageCfg
    };


    try{
        //Content.setPage( PAGE_CONFIGS[ Detector.getPageType() ] );
        if ( Detector.canAddMainControls() ){
            Content.initMainControls();
        }
    }catch(err){
        Debug.log(err);
    }

    if (Detector.isConfluenceMonthPage()){
        
    }
    function addTicketButtonsContainer(){
        var header, container;
        header = d.querySelectorAll('#page-navigation #page-menu')[0];

        container = d.createElement('li');
        container.setAttribute('class', 'ts-ext-ticket-buttons-container');
        header.insertBefore(container, header.firstChild);
        return container;
    }

});