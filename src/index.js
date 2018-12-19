const core = require('gls-core-service');

core.utils.defaultStarter(require('./Main'));

process.on('unhandledRejection', error => {
    core.utils.Logger.error('Unhandled rejection:', error);
    process.exit(2);
});
