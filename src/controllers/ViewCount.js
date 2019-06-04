const express = require('express');
const client = require('prom-client');

const core = require('gls-core-service');
const { Post, View } = require('../model');

const BasicController = core.controllers.Basic;

const server = express();

client.collectDefaultMetrics({ timeout: 5000 });

const callCounter = new client.Counter({
    name: 'api_getpostsviewcount_total',
    help: 'api call count',
});

const callTime = new client.Gauge({
    name: 'api_getpostsviewcount_time',
    help: 'api processing time',
});
callTime.setToCurrentTime();

const hist2 = new client.Histogram({
    name: 'api_getpostsviewcount_time_hist',
    help: 'api processing time histogram',
    buckets: [0.1, 5, 15, 50, 100, 500],
});

class ViewCount extends BasicController {
    async getPostsViewCount({ postLinks }) {
        callCounter.inc();

        console.log('inced');

        if (!postLinks) {
            throw {
                code: 1110,
                message: 'Invalid params',
            };
        }

        const end = callTime.startTimer();
        const endHist = hist2.startTimer();

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
        endHist();

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

server.get('/metrics', (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(client.register.metrics());
});

server.get('/metrics/counter', (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(client.register.getSingleMetricAsString('api_getpostsviewcount_count_2'));
});

console.log('Server listening to 3000, metrics exposed on /metrics endpoint');
server.listen(9777);

setInterval(() => {
    callCounter.inc();
    hist.observe(Math.floor(Math.random() * 3000));
}, 3000);
