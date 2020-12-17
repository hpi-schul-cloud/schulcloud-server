const { expect } = require('chai');
const sleep = require('util').promisify(setTimeout);

const appPromise = require('../../../../../src/app');
const testObjects = require('../../../helpers/testObjects')(appPromise);
const WebUntisSyncer = require('../../../../../src/services/sync/strategies/WebUntisSyncer');

// These tests should use a mock once the webuntis sync actually does something!
describe('webuntis Syncer', () => {
	let app;
	let server;
	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('works', () => new WebUntisSyncer());

	it('implements the Syncer interface', () => {
		expect(WebUntisSyncer.params).to.not.equal(undefined);
		expect(WebUntisSyncer.respondsTo).to.not.equal(undefined);
		expect(WebUntisSyncer.aggregateStats).to.not.equal(undefined);
		expect(new WebUntisSyncer().steps).to.not.equal(undefined);
		expect(new WebUntisSyncer().sync).to.not.equal(undefined);
	});

	it('accepts the correct params', () => {
		const minimalParams = WebUntisSyncer.params({
			query: {
				username: 'webuntisusername',
				password: 'secret123',
				url: 'url.com',
			},
		});
		expect(minimalParams).to.not.be.false;

		const paramsWithData = WebUntisSyncer.params(
			{
				query: {
					username: 'webuntisusername',
					password: 'secret123',
					url: 'url.com',
				},
			},
			{
				datatype: 'inclusive',
				courseMetadataIds: [],
			}
		);
		expect(paramsWithData).to.not.be.false;

		const dryrunParams = WebUntisSyncer.params({
			dryrun: true,
			query: {
				username: 'webuntisusername',
				password: 'secret123',
				url: 'url.com',
			},
		});
		expect(dryrunParams).to.not.be.false;
	});

	it('dryrun persists metadata of webuntis courses', async () => {
		const { _id: datasourceId } = await testObjects.createTestDatasource({
			config: { target: 'webuntis' },
		});
		const args = WebUntisSyncer.params({
			datasourceId,
			dryrun: true,
			query: {
				username: 'webuntisusername',
				password: 'secret123',
				url: 'url.com',
			},
		});
		const syncer = new WebUntisSyncer(app, {}, undefined, ...args);
		const result = await syncer.sync();
		expect(result.success).to.eq(true);
		const metadata = await app.service('webuntisMetadata').find({ query: { datasourceId } });
		expect(metadata.total).to.be.greaterThan(0);
		metadata.data.forEach((el) => {
			expect(el.state).to.equal('new');
		});
	});

	it('runs with an inclusive list of metadataIds', async () => {
		const { _id: datasourceId } = await testObjects.createTestDatasource({
			config: { target: 'webuntis' },
		});
		await Promise.all(
			new Array(20).fill('').map(() =>
				app.service('webuntisMetadata').create({
					datasourceId,
					teacher: 'Renz',
					class: '2a',
					room: '0-23',
					subject: 'mathe',
					state: 'new',
				})
			)
		);
		const metadata = await app.service('webuntisMetadata').find({ query: { datasourceId, $limit: 5 } });
		const toImport = metadata.data.map((md) => md._id);
		const args = WebUntisSyncer.params(
			{
				datasourceId,
				query: {
					username: 'webuntisusername',
					password: 'secret123',
					url: 'url.com',
				},
			},
			{
				datatype: 'inclusive',
				courseMetadataIds: toImport,
			}
		);
		const syncer = new WebUntisSyncer(app, {}, undefined, ...args);
		const result = await syncer.sync();
		expect(result.success).to.eq(true);
		const updatedMetadata = await app.service('webuntisMetadata').find({ query: { datasourceId } });
		expect(updatedMetadata.total).to.be.greaterThan(0);
		updatedMetadata.data.forEach((el) => {
			if (toImport.includes(el._id)) {
				expect(el.state).to.equal('updated');
			} else {
				expect(el.state).to.equal('discarded');
			}
		});
	});

	it('runs with an exclusive list of metadataIds', async () => {
		const { _id: datasourceId } = await testObjects.createTestDatasource({
			config: { target: 'webuntis' },
		});
		await Promise.all(
			new Array(20).fill('').map(() =>
				app.service('webuntisMetadata').create({
					datasourceId,
					teacher: 'Renz',
					class: '2a',
					room: '0-23',
					subject: 'mathe',
					state: 'new',
				})
			)
		);
		const metadata = await app.service('webuntisMetadata').find({ query: { datasourceId, $limit: 5 } });
		const toDiscard = metadata.data.map((md) => md._id);
		const args = WebUntisSyncer.params(
			{
				datasourceId,
				query: {
					username: 'webuntisusername',
					password: 'secret123',
					url: 'url.com',
				},
			},
			{
				datatype: 'exclusive',
				courseMetadataIds: toDiscard,
			}
		);
		const syncer = new WebUntisSyncer(app, {}, undefined, ...args);
		const result = await syncer.sync();
		expect(result.success).to.eq(true);
		const updatedMetadata = await app.service('webuntisMetadata').find({ query: { datasourceId } });
		expect(updatedMetadata.total).to.be.greaterThan(0);
		updatedMetadata.data.forEach((el) => {
			if (toDiscard.includes(el._id)) {
				expect(el.state).to.equal('discarded');
			} else {
				expect(el.state).to.equal('imported');
			}
		});
	});

	it('may be triggered via datasources', async () => {
		const { _id: datasourceId } = await testObjects.createTestDatasource({
			config: {
				target: 'webuntis',
				username: 'untisUsername',
				password: 'secret123',
				url: 'webuntis.org',
			},
		});
		await app.service('datasourceRuns').create({
			datasourceId,
			dryrun: true,
			data: {
				courseMetadataIds: [],
				datatype: 'inclusive',
			},
		});
		await sleep(500); // give sync time to run

		const updatedMetadata = await app.service('webuntisMetadata').find({ query: { datasourceId } });
		expect(updatedMetadata.total).to.be.greaterThan(0);
		updatedMetadata.data.forEach((el) => {
			expect(el.state).to.equal('new');
		});
	});
});
