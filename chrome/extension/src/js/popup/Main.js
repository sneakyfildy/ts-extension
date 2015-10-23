/* global angular */

define(['popup/contentController'], function(contentControllerFn){
    var popApp = angular.module('popApp', []);
    popApp.controller('contentController', ['$scope', contentControllerFn]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, ['popApp']);
    });
});