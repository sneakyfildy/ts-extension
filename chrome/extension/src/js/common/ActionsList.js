define([
    'common/ExtMsgConstructor'
], function(msg){
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
            gotTicketString: transform('hereIsTheTicketString'),
            confluenceToggleMe: transform('confluenceToggleMe'),
            gotNameForToggle: transform('hereIsUserNameForConfluenceToggleMe')
        },
        state: {
            need: transform('generalNeedState'),
            got: transform('generalGotState')
        },
        user: {
            need: transform('generalNeedUser'),
            got: transform('generalGotUser')
        },
        workedTime: {
            needUpdate: transform('pleaseUpdateWorkedTime')
        }
    };

    return ActionsList;
});