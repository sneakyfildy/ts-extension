/* global chrome */

define([
    'common/ActionsList',
    'common/ExtMsgConstructor',
    'common/SelectorsShim'
], function(ActionsList, ExtensionMessage, $$){
    function ConfluenceController(){

    }

    ConfluenceController.prototype.init = function(){
        this.setExtensionListeners();
        this.addTableControls();
        this.setListeners();
        this.checkInitialState();
    };

    ConfluenceController.prototype.checkInitialState = function(){
        var tableToggledStored = parseInt(localStorage.getItem('tableToggled'), 10);
        if (!isNaN(tableToggledStored)){
            if (!!tableToggledStored && !this.tableToggled || !tableToggledStored && !!this.tableToggled){
                this.toggleMe();
            }
        }
    };

    ConfluenceController.prototype.addTableControls = function(){
        var tableEl, controlsEl;
        tableEl = document.querySelectorAll('#main-content .table-wrap')[0];
        controlsEl = document.createElement('div');
        controlsEl.className += ' ts-ext-confluence-controls';
        controlsEl.innerHTML = '<div class="ts-ext-confluence-btn ts-btn-container" data-action="toggleMe" data-type="ts-btn"><span>Toggle Me</span></div>';
        tableEl.parentNode.insertBefore(controlsEl, tableEl);
    };

    ConfluenceController.prototype.setListeners = function(){
        var controlsEl;
        controlsEl = document.querySelectorAll('.ts-ext-confluence-controls')[0];
        controlsEl.addEventListener('click', this.onClick.bind(this));
    };

    ConfluenceController.prototype.setExtensionListeners = function(){
        var me;
        me = this;
        chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
            var data;
            switch(msg['action']){
                case ActionsList.content.gotNameForToggle:
                    if(msg.data){
                        me.userName = msg.data;
                        me.proceedToggleMe(msg);
                    }
                    break;
            }

        });
    };

    ConfluenceController.prototype.onClick = function(event){
        var neededTarget, action;
        neededTarget = event.target;

        while(neededTarget && neededTarget.getAttribute('data-type') !== 'ts-btn'){
            neededTarget = neededTarget.parentNode;
        }

        if (!neededTarget){
            return;
        }

        action = neededTarget.getAttribute('data-action');
        if (action && this[action]){
            try{
                this[action]();
            }catch(err){
                throw 'Failed action: ' + action;
            }
        }else{
            throw 'Unknown action: ' + action;
        }

    };

    ConfluenceController.prototype.toggleMe = function(){
        if (this.userName){
            this.proceedToggleMe();
        }else{
            chrome.runtime.sendMessage(new ExtensionMessage({
                action: ActionsList.content.confluenceToggleMe,
                data: {}
            }));
        }
    };

    ConfluenceController.prototype.proceedToggleMe = function(){
        var name, rows, row, firstCell, table;
        name = this.userName;

        rows = document.querySelectorAll('#main-content .confluenceTable tr');
        for (var i = 0, l = rows.length; i < l; i++){
            row = rows[i];
            firstCell = row.firstElementChild;

            if(firstCell && firstCell.textContent === name){
                $$.addClass(row, 'ts-ext-my-row');
            }else{
                $$.removeClass(row, 'ts-ext-my-row');
            }
        }

        table = document.querySelectorAll('#main-content .confluenceTable')[0];

        if (table){
            $$.hasClass(table, 'ts-ext-toggled-me') ? $$.removeClass(table, 'ts-ext-toggled-me') : $$.addClass(table, 'ts-ext-toggled-me'); // todo toggle method in $$
        }
        this.tableToggled = !!this.tableToggled ? false : true;
        localStorage.setItem('tableToggled', this.tableToggled ? 1 : 0); // todo options
    };


    return new ConfluenceController();
});