/* global chrome */

define([
    'background/record',
    'background/msgRouter'
], function(record, msgRouter){
    msgRouter.addListener('ticketDetails', record.make.bind(record));
});

