define([], function () {
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
