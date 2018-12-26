const core = require('gls-core-service');
const snakeCase = require('lodash/snakeCase');
const stats = core.utils.statsClient;
const BasicConnector = core.services.Connector;

class Connector extends BasicConnector {
    constructor(currentState) {
        super();

        this._currentState = currentState;
    }

    async start() {
        await super.start({
            serverRoutes: {
                getPostsViewCount: this._wrapApi(this._getPostsViewCount),
                recordPostView: this._wrapApi(this._recordPostView),
                markUserOnline: this._wrapApi(this._markUserOnline),
                getUsersLastOnline: this._wrapApi(this._getUsersLastOnline),
            },
        });
    }

    async stop() {
        await super.stop();
        await this.stopNested();
    }

    _wrapApi(func) {
        const apiName = snakeCase(func.name.replace(/^_/, ''));

        return async (...args) => {
            const startTs = Date.now();
            let isError = false;

            try {
                return await func.apply(this, args);
            } catch (err) {
                isError = true;
                throw err;
            } finally {
                let eventName = `meta_api_${apiName}`;

                if (isError) {
                    eventName += '_error';
                }

                stats.timing(eventName, Date.now() - startTs);
            }
        };
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
        if (!username) {
            throw {
                code: 1110,
                message: 'Invalid params',
            };
        }

        await this._currentState.markUserOnline(username);
    }

    async _getUsersLastOnline({ usernames }) {
        if (!usernames || !Array.isArray(usernames)) {
            throw {
                code: 1110,
                message: 'Invalid params',
            };
        }

        const results = [];

        for (const username of usernames) {
            const lastOnlineTs = await this._currentState.getUserLastOnline(
                username
            );

            results.push({
                username,
                lastOnlineTs,
            });
        }

        return {
            results,
        };
    }
}

module.exports = Connector;
