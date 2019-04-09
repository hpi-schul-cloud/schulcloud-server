const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const sleep = require('util').promisify(setTimeout);

const app = require('../../../src/app');
const NewsModel = require('../../../src/services/news/model').newsModel;

describe('news service', () => {
	it('registers correctly', () => {
		expect(app.service('news')).to.not.equal(undefined);
	});

	it('deletes team news after a team is deleted', async () => {
		const teamId = new ObjectId();
		const teamNews = await new NewsModel({
			schoolId: new ObjectId(),
			title: 'team news',
			content: 'here are some news concerning this team',
			target: teamId,
			targetModel: 'teams',
		});

		app.service('teams').emit('deleted', { _id: teamId });
		await sleep(20); // give the event listener time to work

		const result = await NewsModel.count({ _id: teamNews._id });
		expect(result).to.equal(0);
	});
});
