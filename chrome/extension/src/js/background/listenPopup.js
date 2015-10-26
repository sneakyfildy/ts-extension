/* global chrome */

define([
    'background/msgRouter',
    'background/popupStartController'
], function(msgRouter, popupStartController){
    msgRouter.addListener('popupStartButton', popupStartController.onClick.bind(popupStartController));
});

