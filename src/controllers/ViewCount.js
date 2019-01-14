const core = require('gls-core-service');
const { Post, View } = require('../model');

const BasicController = core.controllers.Basic;

class ViewCount extends BasicController {
    async getPostsViewCount({ postLinks }) {
        if (!postLinks) {
            throw {
                code: 1110,
                message: 'Invalid params',
            };
        }

        const results = [];

        for (const postLink of postLinks) {
            results.push({
                postLink,
                viewCount: await this._getPostViewCount(postLink),
            });
        }

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
        if (!postLink || !fingerPrint || !clientRequestIp) {
            throw {
                code: 1110,
                message: 'Invalid params',
            };
        }

        const viewKey = `${postLink}_${clientRequestIp}_${fingerPrint}`;

        try {
            const view = new View({
                viewKey,
                ts: new Date(),
            });

            await view.save();
        } catch (err) {
            // 11000 - duplicate key error
            if (err.code === 11000) {
                return;
            } else {
                throw err;
            }
        }

        await Post.updateOne(
            { postLink },
            { $inc: { viewCount: 1 } },
            { upsert: true }
        );
    }
}

module.exports = ViewCount;
