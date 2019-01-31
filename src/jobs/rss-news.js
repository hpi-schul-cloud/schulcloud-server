const Parser = require('rss-parser');
const { setup } = require('./utils');
const { schoolModel } = require('../services/school/model');
const { newsModel } = require('../services/news/model');

const parser = new Parser();

async function run() {
	await setup();

	const cursor = schoolModel.find({}).cursor();
	let school;
	do {
		school = await cursor.next();
		await processSchool(school);
	}
	while (school);

	process.exit(0);
}

async function processSchool(school) {
	if (!school) return;

	let allCheckedNews = [];

	for (const feedURL of school.rssFeeds) {
		try {
			const checkedNews = await handleFeed(feedURL, school._id);
			allCheckedNews = allCheckedNews.concat(checkedNews)
		} catch (err) {
			console.error(`Could not handle feed ${feedURL} for school ${school._id}`, err);
		}
	}

	await newsModel.deleteMany({ _id: { $nin: allCheckedNews }, source: 'rss', schoolId: school._id });
}

async function handleFeed(feedURL, schoolId) {
	const data = await parser.parseURL(feedURL);
	const checkedNews = [];
	for (const rssItem of data.items) {
		// update (existing) news
		const dbNews = await newsModel.findOneAndUpdate(
			{ externalId: rssItem.guid, schoolId },
			{
				content: rssItem.content,
				title: rssItem.title,
				// categories: rssItem.categories, // NOTE maybe include that later
				createdAt: rssItem.isoDate,
				displayAt: rssItem.isoDate,
				source: 'rss',
				schoolId,
				externalId: rssItem.guid,
			},
			{ upsert: true, new: true },
		);

		checkedNews.push(dbNews._id.toString());
	}

	return checkedNews;
}

run();
