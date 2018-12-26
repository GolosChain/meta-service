const core = require('gls-core-service');
const BasicConnector = core.services.Connector;

class Connector extends BasicConnector {
    constructor(currentState) {
        super();
        this._currentState = currentState;
    }

    async start() {
        await super.start({
            serverRoutes: {
                getPostsViewCount: this._getPostsViewCount.bind(this),
                recordPostView: this._recordPostView.bind(this),
                markUserOnline: this._markUserOnline.bind(this),
                getUserLastOnline: this._getUserLastOnline.bind(this),
            },
        });
    }

    async stop() {
        await super.stop();
        await this.stopNested();
    }

    async _getPostsViewCount({ postLinks }) {
        const results = [];

        for (const postLink of postLinks) {
            results.push({
                postLink,
                viewCount: await this._currentState.getPostViewCount(postLink),
            });
        }

        return {
            results,
        };
    }

    async _recordPostView({ postLink, fingerPrint, clientRequestIp }) {
        if (!postLink || !fingerPrint || !clientRequestIp) {
            throw {
                code: 1110,
                message: 'Invalid params',
            };
        }

        await this._currentState.tryRecordView(postLink, {
            fingerPrint,
            ip: clientRequestIp,
        });
    }

    async _markUserOnline({ username }) {
        await this._currentState.markUserOnline(username);
    }

    async _getUserLastOnline({ username }) {
        if (!username) {
            throw {
                code: 1110,
                message: 'Invalid params',
            };
        }

        const lastOnlineTs = await this._currentState.getUserLastOnline(
            username
        );

        return {
            username,
            lastOnlineTs,
        };
    }
}

module.exports = Connector;
