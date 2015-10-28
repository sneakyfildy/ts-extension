/* global angular */

define(['popup/contentController'], function(contentController){
    var popApp = angular.module('popApp', []);
    popApp.controller('contentController', ['$scope', '$timeout',contentController.controllerConstructor.bind(contentController)]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, ['popApp']);
    });
});