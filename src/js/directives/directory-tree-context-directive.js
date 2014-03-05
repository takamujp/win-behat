angular.module('winbehat').directive("context", function () {
    var contexts = [];
            
    var hide = function () {
        for (var key in contexts) {
            contexts[key].css({
                'display': 'none'
            });
        }
    };
    
    return {
        restrict: 'A',
        scope: '@&',
        compile: function compile (tElement, tAttrs, transclude) {
            return {
                post: function postLink (scope, iElement, iAttrs, controller) {
                    var ul = $('#' + iAttrs.context),
                        last = null;

                    ul.css({'display': 'none'});
                    contexts[iAttrs.context] = ul;
                    $(iElement).on('contextmenu', function (event) {
                        angular.element($("#directory-tree")).scope().contextTarget = scope.file.children[scope.$index];
                        hide();
                        ul.css({
                            position: "fixed",
                            display: "block",
                            left: event.clientX + 'px',
                            top: event.clientY + 'px'
                        });
                        last = event.timeStamp;
                        event.stopPropagation();
                    });

                    $(document).on('click contextmenu', function (event) {
                        var target = $(event.target);
                        if (!target.is(".popover") && !target.parents().is(".popover")) {
                            if (last === event.timeStamp) {
                                return;
                            }
                            ul.css({
                                'display': 'none'
                            });
                        }
                    });
                }
            };
        }
    };
});