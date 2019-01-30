const auth = require('feathers-authentication');
const logger = require('winston');
const Parser = require('rss-parser');
const globalHooks = require('../../../hooks');
const { newsModel, newsHistoryModel } = require('../model');
const parser = new Parser();

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

const deleteNewsHistory = (hook) => {
	newsModel.findOne({ _id: hook.id })
		.then((news) => {
			for (let i = 0; i < news.history.length; i++) {
				newsHistoryModel.findOneAndRemove({ _id: news.history[i] })
					.catch(err => logger.log('error', err));
			}
		});
};

const getRSSMix = async (hook) => {
	const RSSFeed = 'https://netz-21.de/iserv/public/news/rss/Bildungscloud'; // TODO change to saved rss feeds and maybe allow array

	try {
		// NOTE It seems like the after hook is being called twice, once without schoolId in query?
		if (!hook.params.query || !hook.params.query.schoolId) return hook;

		const [dbNews, rssResult] = await Promise.all([
			newsModel.find({ schoolId: hook.params.query.schoolId }),
			parser.parseURL(RSSFeed),
		]);

		const mappedRSS = rssResult.items.map((item) => {
			return {
				url: encodeURIComponent(item.guid),
				createdAt: item.isoDate,
				displayAt: item.isoDate,
				type: 'rss',
				content: item.contentSnippet,
				title: item.title,
			};
		});

		const total = mappedRSS.length + dbNews.length;
		const limit = hook.params.query.$limit ? parseInt(hook.params.query.$limit, 10) : 25;
		const skip = hook.params.query.$skip ? parseInt(hook.params.query.$skip, 10) : 0;

		const mergedNews = mappedRSS
			.concat(dbNews)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.filter((item, index) => {
				const itemPos = index + 1;
				if (itemPos <= skip) return false; // pagination
				if (itemPos > limit + skip) return false; // page length
				return true;
			});

		hook.result = {
			data: mergedNews,
			total,
			limit,
			skip,
		};

		return hook;
	} catch (err) {
		console.error(err);

		// TODO error handling?
	}
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('NEWS_VIEW'), restrictToCurrentSchool, getRSSMix],
	get: [globalHooks.hasPermission('NEWS_VIEW')],
	create: [globalHooks.hasPermission('NEWS_CREATE')],
	update: [globalHooks.hasPermission('NEWS_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('NEWS_EDIT'), restrictToCurrentSchool, globalHooks.permitGroupOperation],
	remove: [globalHooks.hasPermission('NEWS_CREATE'), restrictToCurrentSchool, globalHooks.permitGroupOperation, deleteNewsHistory, globalHooks.ifNotLocal(globalHooks.checkSchoolOwnership)]
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.rssBefore = {
	get: [globalHooks.hasPermission('NEWS_VIEW')],
};