const core = require('gls-core-service');
const env = require('./env');
const Connector = require('./services/Connector');
const Cleaner = require('./services/Cleaner');

const stats = core.utils.statsClient;
const { BasicMain, MongoDB } = core.services;

class Main extends BasicMain {
    constructor() {
        super(stats, env);

        this.defineMeta({
            name: 'meta',
        });

        const mongo = new MongoDB();
        const cleaner = new Cleaner();
        const gate = new Connector();

        this.printEnvBasedConfig(env);
        this.addNested(mongo, cleaner, gate);
    }
}

module.exports = Main;
