/* global angular */

define(['options/optionsController'], function(optionsController){
    var popApp = angular.module('optsApp', []);
    popApp.controller('optionsController', ['$scope',optionsController.controllerConstructor.bind(optionsController)]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, ['optsApp']);
    });
});