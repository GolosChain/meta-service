const core = require('gls-core-service');
const bindAll = require('lodash/bindAll');
const stats = core.utils.statsClient;

const BasicConnector = core.services.Connector;

class Connector extends BasicConnector {
    constructor(currentState) {
        super();

        this._currentState = currentState;

        bindAll(this, ['_getPostSeenCount', '_recordSeen']);
    }

    async start() {
        await super.start({
            serverRoutes: {
                getPostSeenCount: this._getPostSeenCount,
                recordSeen: this._recordSeen,
            },
        });
    }

    async stop() {
        await this.stopNested();
    }

    async _getPostSeenCount({ postLink }) {
        const start = Date.now();

        const count = await this._currentState.getPostSeenCount(postLink);

        stats.timing(
            'seen_counter_get_posts_seen_count_api',
            Date.now() - start
        );

        return {
            count,
        };
    }

    async _recordSeen({ postLink, fingerPrint, ip }) {
        if (!postLink || !fingerPrint) {
            throw {
                code: 11110,
                message: 'Invalid params',
            };
        }

        const start = Date.now();

        await this._currentState.tryRecordSeen(postLink, { fingerPrint, ip });

        stats.timing('seen_counter_record_seen_api', Date.now() - start);

        return {
            status: 'OK',
        };
    }
}

module.exports = Connector;
