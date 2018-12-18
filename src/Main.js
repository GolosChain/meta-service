const core = require('gls-core-service');
const env = require('./env');
const Connector = require('./services/Connector');
const CurrentState = require('./services/CurrentState');

const stats = core.utils.statsClient;
const { Basic, MongoDB } = core.services;

class Main extends Basic {
    constructor() {
        super();

        const mongo = new MongoDB();
        const currentState = new CurrentState();
        const gate = new Connector(currentState);

        this.printEnvBasedConfig(env);
        this.addNested(mongo, currentState, gate);
        this.stopOnExit();
    }

    async start() {
        await this.startNested();
        stats.increment('main_service_start');
    }

    async stop() {
        await this.stopNested();
        stats.increment('main_service_stop');
        process.exit(0);
    }
}

module.exports = Main;
