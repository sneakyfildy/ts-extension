/* global chrome */

define([
    'background/msgRouter',
    'background/popupController',
    'common/ActionsList'
], function(msgRouter, popupController, ActionsList){
    msgRouter.addListener(
        ActionsList.popup.startClick,
        popupController.onStartClick.bind(popupController)
    );
    msgRouter.addListener(
        ActionsList.workedTime.needUpdate,
        popupController.getWorkedTime.bind(popupController)
    );
});

