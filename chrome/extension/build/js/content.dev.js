;(function() {
var common_DebugClass, content_ControllerClass, content_Detector, content_contentModule, ContentMain;
common_DebugClass = function () {
  function DebugClass() {
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
  return DebugClass;
}();
content_ControllerClass = function () {
  function ControllerClass(setup) {
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
          innerHTML: '<span>start</span>'
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
        var text = msg['text'];
        if (!text || text !== 'tsGetDetails') {
          return;
        }
        var data = me.collectTicketData();
        sendResponse(data);
      });
      this.mainButtons.forEach(function (btnDef) {
        if (typeof btnDef.listener === 'function') {
          var btnEl = document.getElementById(btnDef.id);
          btnEl && btnEl.addEventListener('click', btnDef.listener.bind(btnDef.scope || me));
        }
      });
    };
    this.onExportButtonClick = function () {
      var data = this.collectTicketData() || {};
      data.action = 'ts_ext_ticketDetails';
      chrome.runtime.sendMessage(data, function (recordString) {
        Debug.log(recordString);
      });
    };
    this.onStartButtonClick = function () {
      var data = this.collectTicketData() || {};
      data.action = 'ts_ext_startTicket';
      chrome.runtime.sendMessage(data, function (answer) {
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
      // id
      data['id'] = collectParam('id');
      // queue
      data['queue'] = collectParam('queue');
      // subject
      data['subject'] = collectSubject() || 'not found';
      return data;
    };
    /**
     * @private
     * @param {String} className
     * @returns {String}
     */
    function collectParam(className) {
      var el = d.querySelector('.' + className + ' .value');
      return !el ? 'not found' : (el.textContent || 'not found').replace(/[\s\t\n]/gim, '');
    }
    /**
     * Find and return ticket subject as string
     * @returns {String}
     * @private
     */
    function collectSubject() {
      var header = d.querySelectorAll('#header > h1')[0];
      return header.textContent.trim().replace(/^#\d+:/gim, '').trim();
    }
    this.id = function (baseId) {
      return 'ts-ext-' + baseId + '-' + Math.floor(Math.random() * 100000000000000);
    };
    return this.init();
  }
  return ControllerClass;
}();
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
content_contentModule = function (DebugClass, ContentController, Detector) {
  var Debug = new DebugClass();
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
}(common_DebugClass, content_ControllerClass, content_Detector);
ContentMain = undefined;
}());