const Parser = require('rss-parser');
const database = require('../utils/database');

const logger = require('../logger');
const { schoolModel } = require('../services/school/model');
const { newsModel } = require('../services/news/model');

const parser = new Parser();

/**
 * NOTE: this is the first job script. To run it, simply execute 'node src/jobs/rss-news.js'.
 * It is expected to pass MongoDB parameters as process environment variables.
 * Please see src/utils/database.js for more.
*/

async function handleFeed(dbFeed, schoolId) {
	const data = await parser.parseURL(dbFeed.url);
	const checkedNews = [];
	for (const rssItem of data.items) {
		// update (existing) news
		const dbNews = await newsModel.findOneAndUpdate(
			{ externalId: rssItem.guid, schoolId },
			{
				content: rssItem.content,
				title: rssItem.title,
				sourceDescription: dbFeed.description,
				createdAt: rssItem.isoDate,
				displayAt: rssItem.isoDate,
				source: 'rss',
				schoolId,
				externalId: rssItem.guid,
			},
			{ upsert: true, new: true },
		);
		logger.info('fetched', rssItem.title);
		checkedNews.push(dbNews._id.toString());
	}

	return checkedNews;
}

async function processSchool(school) {
	if (!school) return;

	let allCheckedNews = [];

	for (const dbFeed of school.rssFeeds) {
		try {
			const checkedNews = await handleFeed(dbFeed, school._id);
			allCheckedNews = allCheckedNews.concat(checkedNews);
			dbFeed.status = 'success';
		} catch (err) {
			logger.error(`Could not handle feed ${dbFeed.url} (${dbFeed._id}) for school ${school._id}`, err);
			dbFeed.status = 'error';
		}
	}

	await school.save();

	await newsModel.deleteMany({ _id: { $nin: allCheckedNews }, source: 'rss', schoolId: school._id });
}

async function run() {
	await database.connect();

	const cursor = schoolModel.find({}).cursor();
	let school = await cursor.next();
	while (school) {
		await processSchool(school);
		school = await cursor.next();
	}

	await database.close();
	process.exit(0);
}

run();
