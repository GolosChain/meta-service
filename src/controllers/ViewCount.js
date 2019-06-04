const client = require('prom-client');

const core = require('gls-core-service');
const { Post, View } = require('../model');

const BasicController = core.controllers.Basic;

client.collectDefaultMetrics({ timeout: 5000 });

const callCounter = new client.Counter({
    name: 'api_getPostsViewCount_count',
    help: 'api call count',
});

const callCounter2 = new client.Counter({
    name: 'api_getpostsviewcount_count',
    help: 'api call count',
});

const hist = new client.Histogram({
    name: 'metric_name',
    help: 'metric_help',
    buckets: [0.1, 5, 15, 50, 100, 500],
});

const hist2 = new client.Histogram({
    name: 'api_call_time',
    help: 'metric_help',
    buckets: [0.1, 5, 15, 50, 100, 500],
});

class ViewCount extends BasicController {
    async getPostsViewCount({ postLinks }) {
        callCounter.inc();
        callCounter2.inc();

        if (!postLinks) {
            throw {
                code: 1110,
                message: 'Invalid params',
            };
        }

        const start = Date.now();
        const end = hist2.startTimer();

        const results = [];

        await Promise.all(
            postLinks.map(async postLink => {
                results.push({
                    postLink,
                    viewCount: await this._getPostViewCount(postLink),
                });
            })
        );

        end();

        const elapsed = Date.now() - start;
        hist.observe(elapsed);

        return {
            results,
        };
    }

    async _getPostViewCount(postLink) {
        const post = await Post.findOne({ postLink });

        if (!post || !post.viewCount) {
            return 0;
        }

        return post.viewCount;
    }

    async recordPostView({ postLink, fingerPrint, clientRequestIp }) {
        if (!postLink) {
            throw {
                code: 1110,
                message: 'Invalid params',
            };
        }

        // if (!postLink || !fingerPrint || !clientRequestIp) {
        //     throw {
        //         code: 1110,
        //         message: 'Invalid params',
        //     };
        // }
        //
        // const viewKey = `${postLink}_${clientRequestIp}_${fingerPrint}`;
        //
        // try {
        //     const view = new View({
        //         viewKey,
        //         ts: new Date(),
        //     });
        //
        //     await view.save();
        // } catch (err) {
        //     // 11000 - duplicate key error
        //     if (err.code === 11000) {
        //         return;
        //     } else {
        //         throw err;
        //     }
        // }

        await Post.updateOne({ postLink }, { $inc: { viewCount: 1 } }, { upsert: true });
    }
}

module.exports = ViewCount;
