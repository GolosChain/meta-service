const path = require('path');
const fs = require('fs-extra');
const core = require('gls-core-service');
const moment = require('moment');
const times = require('lodash/times');
const { Post } = require('../model');

const BasicService = core.services.Basic;
const { Logger, statsClient } = core.utils;

const HISTORY_LIMIT = 24; // hours
const STATE_DATE_FORMAT = 'YYYY-MM-DD_HH-mm-ss';
const STATE_DIR = path.join(__dirname, '../../state');

class CurrentState extends BasicService {
    constructor() {
        super();

        this._pools = times(HISTORY_LIMIT, () => new Set());
    }

    async start() {
        await this.restore();

        const startOfNextHour = moment()
            .endOf('hour')
            .add(30, 'seconds');

        this.startLoop(
            startOfNextHour - Date.now(),
            Number(moment.duration(1, 'hour'))
        );
    }

    async stop() {
        await this._saveCurrentState();
    }

    async restore() {
        this._tryRecover().catch(err => {
            Logger.error('Recovery failed', err);
        });
    }

    async iteration() {
        await this._saveState();
        this._pools.unshift(new Map());
        this._pools.pop();
    }

    async getPostSeenCount(postLink) {
        const post = await Post.findOne({ postLink });

        if (!post) {
            return 0;
        }

        return post.count;
    }

    async tryRecordSeen(postLink, { fingerPrint, ip }) {
        const key = `${postLink}_${ip}_${fingerPrint}`;

        for (const pool of this._pools) {
            if (pool.has(key)) {
                return;
            }
        }

        await Post.updateOne(
            { postLink },
            { $inc: { count: 1 } },
            { upsert: true }
        );

        this._pools[0].add(key);
    }

    async _tryRecover() {
        await this._removeOldFiles();

        const now = moment();

        await this._iterateStateFiles(async ({ fileName, ts }) => {
            const diff = now.diff(ts, 'hours') + 1;

            if (diff >= 1 && diff < HISTORY_LIMIT) {
                const poolArray = JSON.parse(
                    await fs.readFile(path.join(STATE_DIR, fileName))
                );

                const already = this._pools[diff];

                if (already) {
                    for (const key of poolArray) {
                        already.add(key);
                    }
                } else {
                    this._pools[diff] = new Set(poolArray);
                }
            }
        });
    }

    async _saveState() {
        await this._removeOldFiles();
        await this._saveCurrentState();
    }

    async _saveCurrentState() {
        const pool = this._pools[0];

        if (pool.size) {
            await fs.writeFile(
                path.join(
                    STATE_DIR,
                    moment().format(STATE_DATE_FORMAT) + '.json'
                ),
                JSON.stringify(Array.from(pool.keys()), null, 2)
            );
        }
    }

    async _removeOldFiles() {
        const dayAgo = moment().subtract(HISTORY_LIMIT, 'hour');

        await this._iterateStateFiles(async ({ fileName, ts }) => {
            if (ts < dayAgo) {
                await fs.unlink(fileName);
            }
        });
    }

    async _iterateStateFiles(callback) {
        const fileNames = await fs.readdir(STATE_DIR);

        for (const fileName of fileNames) {
            if (fileName.endsWith('.json')) {
                const date = fileName.replace(/\.json$/, '');

                const ts = moment(date, STATE_DATE_FORMAT);

                if (!ts.isValid()) {
                    Logger.warn(`Invalid state filename ${fileName}`);
                    continue;
                }

                await callback({ fileName, ts });
            }
        }
    }
}

module.exports = CurrentState;
