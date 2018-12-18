const core = require('gls-core-service');
const stats = core.utils.statsClient;
const BasicConnector = core.services.Connector;

class Connector extends BasicConnector {
    constructor(currentState) {
        super();

        this._currentState = currentState;

        this._getPostSeenCount = this._getPostSeenCount.bind(this);
        this._recordPostSeen = this._recordPostSeen.bind(this);
    }

    async start() {
        await super.start({
            serverRoutes: {
                getPostSeenCount: this._getPostSeenCount,
                recordPostSeen: this._recordPostSeen,
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

    async _recordPostSeen({ postLink, fingerPrint, ip }) {
        if (!postLink || !fingerPrint || !ip) {
            throw {
                code: 11110,
                message: 'Invalid params',
            };
        }

        const start = Date.now();

        await this._currentState.tryRecordSeen(postLink, { fingerPrint, ip });

        stats.timing('seen_counter_record_post_seen_api', Date.now() - start);
    }
}

module.exports = Connector;
