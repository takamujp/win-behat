if (process._events.uncaughtException.length > 0) {
    process._events.uncaughtException.splice(0, 1);
}
process.on('uncaughtException', function (e) {
    console.group('Exception');
    if (!!e.message) {
        console.log(e.message);
    }
    if (!!e.stack) {
        console.log(e.stack);
    }
    console.log(e);
    console.groupEnd();
});
if (process._events.uncaughtException.length > 1 && !!process._events.uncaughtException[0].toString().match(/native code/)) {
    process._events.uncaughtException.splice(0, 1);
}

angular.module('winbehat', ['ui.codemirror', 'ui.bootstrap']);