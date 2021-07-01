const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const sleep = require('util').promisify(setTimeout);

const appPromise = require('../../../src/app');
const { newsModel: News } = require('../../../src/services/news/model');

describe.only('news service', () => {
	let app;
	let newsService;

	before(async () => {
		app = await appPromise;
		newsService = app.service('news');
	});

	it('public service has been disabled', () => {
		expect(newsService, 'use v3 instead').to.equal(undefined);
	});

	describe('event handlers', () => {
		describe('when deleting a team', () => {
			it('should remove news of the deleted team', async () => {
				const teamId = new ObjectId();
				const schoolId = new ObjectId();
				await new News({
					schoolId,
					creatorId: new ObjectId(),
					title: 'team news',
					content: 'here are some news concerning this team',
					target: teamId,
					targetModel: 'teams',
				}).save();
				expect(await News.countDocuments({ schoolId })).to.equal(1);

				app.service('teams').emit('removed', { _id: teamId });
				await sleep(5000); // give the event listener time to work

				expect(await News.countDocuments({ schoolId })).to.equal(0);
			});

			it('should not delete any other news', async () => {
				const schoolId = new ObjectId();
				const teamId = new ObjectId();
				await new News({
					schoolId,
					creatorId: new ObjectId(),
					title: 'team news',
					content: 'here are some news concerning this team',
					target: teamId,
					targetModel: 'teams',
				}).save();
				const courseId = new ObjectId();
				const courseNews = await new News({
					schoolId,
					creatorId: new ObjectId(),
					title: 'course news',
					content: 'here are some news concerning this course',
					target: courseId,
					targetModel: 'courses',
				}).save();
				const schoolNews = await new News({
					schoolId,
					creatorId: new ObjectId(),
					title: 'global school news',
					content: 'yo ho ho, and a bottle of rum',
				}).save();

				const newsCount = await News.countDocuments({ schoolId });
				expect(newsCount).to.equal(3);

				app.service('teams').emit('removed', { _id: teamId });
				await sleep(100); // give the event listener time to work

				const result = await News.countDocuments({ schoolId });
				expect(result).to.equal(2);

				await News.remove({
					_id: { $in: [courseNews._id, schoolNews._id] },
				});
			});
		});
	});
});
