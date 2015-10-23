define('popup/contentController',[], function () {
    function contentController($scope) {
        var my = $scope;
        my.startBtn = {
            caption: 'Start',
            onClick: function () {
                console.log(new Date());
                chrome.runtime.sendMessage({greeting: "hello"}, function (response) {
                    console.log(response.farewell);
                });
            }
        };

        $scope.greetMe = 'World';
    }
    ;

    return contentController;
});

/* global angular */

define('popup/Main',['popup/contentController'], function(contentControllerFn){
    var popApp = angular.module('popApp', []);
    popApp.controller('contentController', ['$scope', contentControllerFn]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, ['popApp']);
    });
});
/**
 * This is the main JS file for popup script, it is a subject to grunt's build routine.
 */

require([
    'popup/Main'
], function(){
});

define("PopupMain", function(){});

