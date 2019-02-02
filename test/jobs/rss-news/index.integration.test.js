const chai = require('chai');
const path = require('path');
const Parser = require('rss-parser');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const { schoolModel } = require('../../../src/services/school/model');
const { newsModel } = require('../../../src/services/news/model');

const parser = new Parser();

const { expect } = chai;

describe('RSS Feed Crawler Integration', () => {
	let sampleSchool;
	let sampleRSSContent;
	let dbRSSNews;
	const sampleRSSFeed = {
		url: 'https://netz-21.de/iserv/public/news/rss/Bildungscloud',
		description: 'netz-21',
	};

	before(async () => {
		sampleSchool = (await schoolModel.findOneAndUpdate(
			{},
			{ $set: { rssFeeds: [sampleRSSFeed] } },
			{ new: true },
		)).toObject();

		sampleRSSContent = await parser.parseURL(sampleRSSFeed.url);
	});

	beforeEach(runWorker);

	after(async () => {
		mongoose.connection.close();
	});

	it('should create new news items based on schools rss feeds', async () => {
		dbRSSNews = (await newsModel.findOne({ source: 'rss' })).toObject();
		expect(dbRSSNews).to.exist;
		expect(dbRSSNews.sourceDescription).to.equal(sampleRSSFeed.description);
		expect(dbRSSNews.source).to.equal('rss');
		expect(dbRSSNews.externalId).to.exist;
	});

	describe('Override changed news', () => {
		const changedContent = 'test';
		before(async () => {
			dbRSSNews = await newsModel.findByIdAndUpdate(
				dbRSSNews._id,
				{ content: changedContent },
				{ new: true },
			);
		});

		it('should override changed news', async () => {
			dbRSSNews = await newsModel.findById(dbRSSNews._id);
			expect(dbRSSNews.content).to.not.equal(changedContent);
		});
	});
	describe('Delete manually created rss news', () => {
		let manualNewsId;
		before(async () => {
			const manualNews = await new newsModel({
				title: 'a',
				content: 'a',
				schoolId: sampleSchool._id,
				source: 'rss',
			}).save();

			manualNewsId = manualNews._id;
		});

		it('should remove manually created news items', async () => {
			const manualNews = await newsModel.findById(manualNewsId);
			expect(manualNews).to.not.exist;
		});
	});

	describe('Delete removed News items from removed rss feeds', () => {
		before(async () => {
			await schoolModel.findByIdAndUpdate(sampleSchool._id, { rssFeeds: [] });
		});

		it('should remove news items from deleted rss feeds', async () => {
			const rssNewsCount = await newsModel.count({ source: 'rss' });
			expect(rssNewsCount).to.equal(0);
		});
	});
});

function runWorker() {
	return new Promise((resolve) => {
		const child = exec(
			`node ${path.join(__dirname, '../../../src/jobs/rss-news.js')}`,
			{ env: { NODE_ENV: 'test' } },
		);

		child.on('exit', () => {
			resolve();
		});
	});
}
