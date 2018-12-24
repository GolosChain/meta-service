const core = require('gls-core-service');
const stats = core.utils.statsClient;
const BasicConnector = core.services.Connector;

class Connector extends BasicConnector {
    constructor(currentState) {
        super();

        this._currentState = currentState;

        this._getPostsViewCount = this._getPostsViewCount.bind(this);
        this._recordPostView = this._recordPostView.bind(this);
    }

    async start() {
        await super.start({
            serverRoutes: {
                getPostsViewCount: this._getPostsViewCount,
                recordPostView: this._recordPostView,
            },
        });
    }

    async stop() {
        await this.stopNested();
    }

    async _getPostsViewCount({ postLinks }) {
        const start = Date.now();

        const results = [];

        for (const postLink of postLinks) {
            results.push({
                postLink,
                viewCount: await this._currentState.getPostViewCount(postLink),
            });
        }

        stats.timing('meta_get_posts_view_count_api', Date.now() - start);

        return {
            results,
        };
    }

    async _recordPostView({ postLink, fingerPrint, clientRequestIp }) {
        if (!postLink || !fingerPrint || !clientRequestIp) {
            throw {
                code: 11110,
                message: 'Invalid params',
            };
        }

        const start = Date.now();

        await this._currentState.tryRecordView(postLink, {
            fingerPrint,
            ip: clientRequestIp,
        });

        stats.timing('meta_record_post_view_api', Date.now() - start);
    }
}

module.exports = Connector;
