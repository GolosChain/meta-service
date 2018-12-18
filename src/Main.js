const core = require('gls-core-service');
const env = require('./env');
const Connector = require('./services/Connector');
const CurrentState = require('./services/CurrentState');

const stats = core.utils.statsClient;
const { BasicMain, MongoDB } = core.services;

class Main extends BasicMain {
    constructor() {
        super(stats, env);

        const mongo = new MongoDB();
        const currentState = new CurrentState();
        const gate = new Connector(currentState);

        this.printEnvBasedConfig(env);
        this.addNested(mongo, currentState, gate);
    }
}

module.exports = Main;
