const path = require('path');
const fs = require('fs-extra');
const core = require('gls-core-service');
const moment = require('moment');
const { Post, View } = require('../model');

const BasicService = core.services.Basic;

const HISTORY_LIMIT = 24; // hours

class CurrentState extends BasicService {
    async start() {
        this.startLoop(5 * 60 * 1000, 10 * 60 * 1000);
    }

    async iteration() {
        await View.deleteMany({
            ts: { $lt: moment().subtract(HISTORY_LIMIT, 'hour') },
        });
    }

    async getPostViewCount(postLink) {
        const post = await Post.findOne({ postLink });

        if (!post) {
            return 0;
        }

        return post.viewCount;
    }

    async tryRecordView(postLink, { fingerPrint, ip }) {
        const viewKey = `${postLink}_${ip}_${fingerPrint}`;

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

module.exports = CurrentState;
