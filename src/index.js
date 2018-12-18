require('gls-core-service').utils.defaultStarter(require('./Main'));

process.on('unhandledRejection', error => {
    console.error('Unhandled rejection:', error);
    process.exit(10);
});
