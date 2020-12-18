/* eslint-disable */
import chai from 'chai';
import path from 'path';
import http from 'http';
import { exec } from 'child_process';

import { schoolModel } from '../../../src/services/school/model';
import { newsModel } from '../../../src/services/news/model';


const { expect } = chai;

function runWorker() {
	return new Promise((resolve, reject) => {
		const child = exec(
			`node ${path.join(__dirname, '../../../src/jobs/rss-news.js')}`,
			{ env: { ...process.env } },
		);

		child.on('exit', resolve);
		child.on('error', reject);
		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);
	});
}

describe('RSS Feed Crawler Integration', function () {
	this.timeout(10000)
	
	const mockPort = 3039;
	let mockServer;

	const mockRssResponse = `<?xml version="1.0" encoding="utf-8"?>
	<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
		<channel>
			<atom:link href="http://www.hpi.de/" rel="self" type="application/rss+xml" />
			<title><![CDATA[News des Fachgebietes Informationssysteme]]></title>
			<link><![CDATA[http://www.hpi.de/]]></link>
			<description><![CDATA[]]></description>
			<copyright><![CDATA[]]></copyright>
			<language><![CDATA[de]]></language>
			<item>
				<title><![CDATA[Accepted Paper at LREC 2020]]></title>
				<link><![CDATA[https://hpi.de/naumann/news/accepted-paper-at-lrec-2020.html]]></link>
				<description><![CDATA[]]></description>
				<guid><![CDATA[https://hpi.de/naumann/news/accepted-paper-at-lrec-2020.html]]></guid>
				<pubDate>Wed, 12 Feb 2020 14:07:00 +0100</pubDate>
				<lastBuildDate>Wed, 12 Feb 2020 14:07:38 +0100</lastBuildDate>
			</item>
			<item>
				<title><![CDATA[Contribution of a Chapter...0]]></title>
				<link><![CDATA[https://hpi.de/naumann/news/contribution-of-a-chapter0.html]]></link>
				<description><![CDATA[]]></description>
				<guid><![CDATA[https://hpi.de/naumann/news/contribution-of-a-chapter0.html]]></guid>
				<pubDate>Mon, 03 Feb 2020 13:13:00 +0100</pubDate>
				<lastBuildDate>Tue, 04 Feb 2020 13:14:39 +0100</lastBuildDate>
			</item>
		</channel>
	</rss>`;

	let sampleSchool;
	let dbRSSNews;

	const sampleRSSFeed = {
		url: `http://localhost:${mockPort}`,
		description: 'Test News',
	};

	before('start mock server', (done) => {
		const requestHandler = (req, res) => {
			res.end(mockRssResponse);
		};
		mockServer = http.createServer(requestHandler);
		mockServer.listen(mockPort, (err) => {
			if (err) {
				throw err;
			}
			done();
		});
	});

	after('stop mock server', (done) => {
		mockServer.close(done);
	});

	before(async function () {
		 sampleSchool = await schoolModel.findOneAndUpdate(
			{},
			{ $set: { rssFeeds: [sampleRSSFeed] } },
			{ new: true },
		).lean().exec();
	});

	beforeEach(runWorker);

	it('should create new news items based on schools rss feeds', async () => {
		dbRSSNews = await newsModel.findOne({ source: 'rss' }).lean().exec();
		expect(dbRSSNews).to.exist;
		expect(dbRSSNews.sourceDescription).to.equal(sampleRSSFeed.description);
		expect(dbRSSNews.source).to.equal('rss');
		expect(dbRSSNews.externalId).to.exist;
	});

	it('should set rssFeed status to success', async () => {
		const school = (await schoolModel.findById(sampleSchool._id)).toObject();

		const successRSSFeed = school.rssFeeds.find(el => el.url === sampleRSSFeed.url);
		expect(successRSSFeed.status).to.equal('success');
	});

	describe('Invalid RSS Feeds', async () => {
		const invalidFeed = {
			url: 'blob',
			description: 'blub',
		};

		before(async () => {
			await schoolModel.findByIdAndUpdate(sampleSchool._id, { $push: { rssFeeds: invalidFeed } });
		});

		it('should set rssFeed status to error for invalid urls', async () => {
			const school = (await schoolModel.findById(sampleSchool._id)).toObject();

			const errorRSSFeed = school.rssFeeds.find(el => el.url === invalidFeed.url);
			expect(errorRSSFeed.status).to.equal('error');
		});
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
