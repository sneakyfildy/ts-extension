;(function() {
var common_DebugLoggerConstructor, common_ExtMsgConstructor, common_ActionsList, content_ContentScriptController, content_Detector, content_contentModule, ContentMain;
common_DebugLoggerConstructor = function () {
  function DebugLoggerConstructor() {
    this.enabled = false;
    this.on = function () {
      this.enabled = true;
    };
    this.off = function () {
      this.enabled = false;
    };
    this.log = function (anything) {
      if (!!this.enabled) {
        console.log('debug log', anything);
      }
    };
  }
  return DebugLoggerConstructor;
}();
common_ExtMsgConstructor = function () {
  function ExtMsgConstructor(config) {
    if (typeof config.action === 'undefined' || typeof config.data === 'undefined') {
      throw 'Action and data properties are required';
    }
    this.action = config.action;
    this.data = config.data;
    if (this.action.indexOf(this.actionPrefix) < 0) {
      this.action = this.addPrefix(this.action);
    }
  }
  ExtMsgConstructor.prototype.actionPrefix = 'ts_ext_';
  ExtMsgConstructor.prototype.addPrefix = function (sourceStr) {
    var readyAction = sourceStr.indexOf(this.actionPrefix) < 0 ? this.actionPrefix + sourceStr : sourceStr;
    return readyAction;
  };
  return ExtMsgConstructor;
}();
common_ActionsList = function (msg) {
  var transform = msg.prototype.addPrefix.bind(msg.prototype);
  var ActionsList = {
    popup: {
      startClick: transform('popupStartButton'),
      needState: transform('popupNeedState'),
      gotState: transform('popupGotState')
    },
    content: {
      clipboardClick: transform('getTicketData'),
      contextMenuClick: transform('getTicketDataByContextMenu'),
      startTicketClick: transform('startTicketClick'),
      gotTicketString: transform('hereIsTheTicketString')
    },
    state: {
      need: transform('generalNeedState'),
      got: transform('generalGotState')
    },
    workedTime: { needUpdate: transform('pleaseUpdateWorkedTime') }
  };
  return ActionsList;
}(common_ExtMsgConstructor);
content_ContentScriptController = function (ActionsList, ExtensionMessage) {
  function ContentScriptController(setup) {
    setup = setup || {};
    var Debug = setup.Debug;
    var d = window.document;
    this.cfg = null;
    this.mainButtonCls = 'ts-btn-container';
    var addTagContainerId, addTagContainerCls, tagButtonCls, tagControlButtonCls;
    addTagContainerId = 'ts-add-tag-container-' + Math.floor(Math.random() * 100000000000000);
    addTagContainerCls = 'ts-add-tag-container';
    tagButtonCls = 'ts-tag-btn';
    tagControlButtonCls = 'ts-tag-control-btn';
    this.init = function () {
      this.mainButtons = [
        {
          innerHTML: '<span>clipboard</span>',
          id: this.id('clipboard-btn'),
          title: 'Form TS record and copy to clipboard',
          cls: this.mainButtonCls,
          listener: this.onExportButtonClick
        },
        {
          id: this.id('start-btn'),
          title: 'Start ticket',
          cls: this.mainButtonCls,
          innerHTML: '<span>start</span>',
          listener: this.onStartButtonClick
        },
        {
          id: this.id('stop-btn'),
          title: 'Stop ticket',
          cls: this.mainButtonCls,
          innerHTML: '<span>' + 'stop' + '</span>'
        }
      ];
      return this;
    };
    this.setPage = function (pageCfg) {
      this.cfg = pageCfg;
      this.processPage();
    };
    this.initMainControls = function () {
      var container = addMainButtonsContainer();
      this.addMainButtons(container);
      this.setMainListeners();
    };
    this.processPage = function () {
      try {
        this.cfg.processingFn();
        this.setListeners();
      } catch (err) {
        Debug.log(err);
      }
    };
    this.setMainListeners = function () {
      var me;
      me = this;
      chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        var data;
        switch (msg['action']) {
        case ActionsList.content.contextMenuClick:
          data = me.collectTicketData();
          sendResponse(data);
          break;
        case ActionsList.content.gotTicketString:
          me.onGetTicketString(msg.data);
          break;
        }
      });
      this.mainButtons.forEach(function (btnDef) {
        if (typeof btnDef.listener === 'function') {
          var btnEl = document.getElementById(btnDef.id);
          btnEl && btnEl.addEventListener('click', btnDef.listener.bind(btnDef.scope || me));
        }
      });
    };
    this.onExportButtonClick = function () {
      chrome.runtime.sendMessage(new ExtensionMessage({
        action: ActionsList.content.clipboardClick,
        data: this.collectTicketData() || {}
      }));
    };
    this.onStartButtonClick = function () {
      chrome.runtime.sendMessage(new ExtensionMessage({
        action: ActionsList.content.startTicketClick,
        data: this.collectTicketData() || {}
      }), function (answer) {
        Debug.log(answer);
      });
    };
    /* refactor, split, make explicit */
    this.onTagButtonClick = function (event) {
      var tagInputContainer, tagInput, clicked, tag, btnType, btnValue;
      clicked = event.target;
      btnType = clicked && clicked.getAttribute('data-type');
      tagInputContainer = d.querySelectorAll('.edit-custom-fields .edit-custom-field .entry')[0];
      if (!tagInputContainer) {
        return;
      }
      tagInput = tagInputContainer.querySelectorAll('textarea')[0];
      if (!tagInput) {
        return;
      }
      switch (btnType) {
      case 'tag':
        tag = clicked && clicked.getAttribute('data-value');
        if (tagInput.value === '\n') {
          tagInput.value = '';
        }
        tagInput.value += tag + '\n';
        break;
      case 'control':
        btnValue = clicked && clicked.getAttribute('data-value');
        if (btnValue === 'clear') {
          tagInput.value = '\n';
          return;
        }
        break;
      }
    };
    this.addMainButtons = function (where) {
      var me = this;
      this.mainButtons.forEach(function (btn) {
        where.appendChild(me.makeGenericButton(btn));
      });
    };
    /**
     * Very special routine
     * @returns {undefined}
     */
    this.addTagButtons = function () {
      var tagInputContainer, buttonArea, tags;
      tagInputContainer = d.querySelectorAll('.edit-custom-fields .edit-custom-field .entry')[0];
      if (!tagInputContainer) {
        return;
      }
      tags = [
        'CodeReview',
        'SomethingElse'
      ];
      buttonArea = d.createElement('div');
      buttonArea.setAttribute('id', addTagContainerId);
      buttonArea.setAttribute('class', addTagContainerCls);
      tags.forEach(function (tagName) {
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
    };
    function addMainButtonsContainer() {
      var header, container;
      header = d.querySelectorAll('#page-navigation #page-menu')[0];
      container = d.createElement('li');
      container.setAttribute('class', 'ts-ext-ticket-buttons-container');
      header.insertBefore(container, header.firstChild);
      return container;
    }
    function addTagControlButtons(buttonArea) {
      var tagInputContainer, controls;
      if (!buttonArea) {
        return;
      }
      controls = [{
          name: 'clear',
          title: 'Clear'
        }];
      controls.forEach(function (controlDef) {
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
    this.makeGenericButton = function (cfg) {
      var button = d.createElement('div');
      button.setAttribute('id', cfg.id);
      cfg.cls && button.setAttribute('class', cfg.cls);
      cfg.title && button.setAttribute('title', cfg.title);
      button.innerHTML = cfg.innerHTML;
      return button;
    };
    this.collectTicketData = function () {
      var data = {};
      data['id'] = collectUrlParam('id');
      return data;
    };
    /**
     * Extract required param from query string
     * @param {type} paramName
     * @returns {undefined}
     */
    function collectUrlParam(paramName) {
      var urlSplitByHash, hashString, queryString, urlParams;
      urlSplitByHash = document.location.href.split('#');
      queryString = urlSplitByHash[0].split('?')[1];
      urlParams = makeParamsFromUrlString(queryString) || {};
      return urlParams[paramName];
    }
    function makeParamsFromUrlString(str) {
      if (!str) {
        return {};
      }
      var pairs, keys, params;
      pairs = str.split('&');
      params = {};
      pairs.forEach(function (term) {
        var pair, key, value;
        pair = term.split('=');
        key = pair.shift();
        value = decodeURIComponent(pair.join('='));
        params[key] = value;
      });
      return params;
    }
    this.id = function (baseId) {
      return 'ts-ext-' + baseId + '-' + Math.floor(Math.random() * 100000000000000);
    };
    /**
     * Fires when background generates ticket string by request from this tab
     * @param {String} ticketString Ready timesheet record
     * @returns {undefined}
     */
    this.onGetTicketString = function (ticketString) {
      Debug.log(ticketString);
    };
    return this.init();
  }
  return ContentScriptController;
}(common_ActionsList, common_ExtMsgConstructor);
content_Detector = function () {
  function DetectorClass() {
    /**
     * Tries to check if this page is a Reuqest Tracker page, which can be
     * a subject of this extension - if we can add a button.
     * @returns {Boolean}
     */
    this.detectRequestTracker = function () {
      var url;
      url = document.location.href;
      return url.match(/rt\/Ticket\/Modify.html/) !== null || url.match(/rt\/Ticket\/Display.html/) !== null;
    };
    this.getPageType = function () {
      var url;
      url = document.location.href;
      if (url.match(/rt\/Ticket\/Modify.html/) !== null) {
        return 'MODIFY_PAGE';
      }
      if (url.match(/rt\/Ticket\/Display.html/) !== null) {
        return 'DISPLAY_PAGE';
      }
    };
    /**
     * Function to detect if there's an ability to add main control buttons
     * @returns {Boolean}
     */
    this.canAddMainControls = function () {
      var check = document.querySelectorAll('#page-navigation #page-menu')[0];
      return !!check;
    };
  }
  return new DetectorClass();
}();
content_contentModule = function (DebugLoggerConstructor, ContentController, Detector) {
  var Debug = new DebugLoggerConstructor();
  Debug.on();
  var Content = new ContentController({ Debug: Debug });
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
    processingFn: function () {
      var container;
      if (Detector.detectRequestTracker()) {
        container = addTicketButtonsContainer();
        Content.addButtons(container);
      }
    }
  };
  modifyPageCfg = {
    buttons: [],
    processingFn: function () {
      if (Detector.detectRequestTracker()) {
        Content.addTagButtons();
      }
    }
  };
  var PAGE_CONFIGS = {
    DISPLAY_PAGE: displayPageCfg,
    MODIFY_PAGE: modifyPageCfg
  };
  try {
    //Content.setPage( PAGE_CONFIGS[ Detector.getPageType() ] );
    if (Detector.canAddMainControls()) {
      Content.initMainControls();
    }
  } catch (err) {
    Debug.log(err);
  }
  function addTicketButtonsContainer() {
    var header, container;
    header = d.querySelectorAll('#page-navigation #page-menu')[0];
    container = d.createElement('li');
    container.setAttribute('class', 'ts-ext-ticket-buttons-container');
    header.insertBefore(container, header.firstChild);
    return container;
  }
}(common_DebugLoggerConstructor, content_ContentScriptController, content_Detector);
ContentMain = undefined;
}());