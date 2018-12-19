const core = require('gls-core-service');
const stats = core.utils.statsClient;
const BasicConnector = core.services.Connector;

class Connector extends BasicConnector {
    constructor(currentState) {
        super();

        this._currentState = currentState;

        this._getPostsSeenCount = this._getPostsSeenCount.bind(this);
        this._recordPostSeen = this._recordPostSeen.bind(this);
    }

    async start() {
        await super.start({
            serverRoutes: {
                getPostsSeenCount: this._getPostsSeenCount,
                recordPostSeen: this._recordPostSeen,
            },
        });
    }

    async stop() {
        await this.stopNested();
    }

    async _getPostsSeenCount({ postLinks }) {
        const start = Date.now();

        const results = [];

        for (const postLink of postLinks) {
            results.push({
                postLink,
                viewCount: await this._currentState.getPostSeenCount(postLink),
            });
        }

        stats.timing(
            'look_counter_get_posts_seen_count_api',
            Date.now() - start
        );

        return {
            results,
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

        stats.timing('look_counter_record_post_seen_api', Date.now() - start);
    }
}

module.exports = Connector;
