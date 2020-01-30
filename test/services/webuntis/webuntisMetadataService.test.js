const { expect } = require('chai');

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const webuntisMetadataService = app.service('webuntisMetadata');
const { webuntisMetadataModel } = require('../../../src/services/webuntis/model');
const { datasourceRunModel } = require('../../../src/services/datasources/model');

describe('webuntis metadata service', () => {
	let server;
	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
		testObjects.cleanup();
	});

	it('registered the webuntis metadata service', () => {
		expect(app.service('webuntisMetadata')).to.not.be.undefined;
	});

	it('internal call can CREATE metadata', async () => {
		const datasource = await testObjects.createTestDatasource({
			config: { target: 'none' },
			name: 'datasource',
		});
		const run = await app.service('datasourceRuns').create({ datasourceId: datasource._id });
		const createResult = await webuntisMetadataService.create({
			datasourceRunId: run._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'mathe',
		});
		expect(createResult).to.not.be.undefined;
		expect(createResult.datasourceRunId).to.equal(run._id);

		webuntisMetadataModel.deleteOne({ _id: createResult._id }).lean().exec();
		await datasourceRunModel.deleteOne({ _id: run._id }).lean().exec();
	});

	it('internal call can FIND metadata', async () => {
		const datasource = await testObjects.createTestDatasource({
			config: { target: 'none' },
			name: 'datasource',
		});
		const run = await app.service('datasourceRuns').create({ datasourceId: datasource._id });
		const metadata = await webuntisMetadataModel.create({
			datasourceRunId: run._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'mathe',
		});

		const result = await webuntisMetadataService.find({ query: { datasourceRunId: run._id } });

		expect(result).to.not.be.undefined;
		expect(Array.isArray(result.data)).to.be.true;
		expect(result.total).to.eq(1);

		webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
		await datasourceRunModel.deleteOne({ _id: run._id }).lean().exec();
	});

	it('internal call can GET metadata', async () => {
		const datasource = await testObjects.createTestDatasource({
			config: { target: 'none' },
			name: 'datasource',
		});
		const run = await app.service('datasourceRuns').create({ datasourceId: datasource._id });
		const metadata = await webuntisMetadataModel.create({
			datasourceRunId: run._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'mathe',
		});

		const result = await webuntisMetadataService.get(metadata._id);

		expect(result).to.not.be.undefined;
		expect(result.datasourceRunId.toString()).to.eq(run._id.toString());

		webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
		await datasourceRunModel.deleteOne({ _id: run._id }).lean().exec();
	});

	it('internal call can REMOVE metadata', async () => {
		const datasource = await testObjects.createTestDatasource({
			config: { target: 'none' },
			name: 'datasource',
		});
		const run = await app.service('datasourceRuns').create({ datasourceId: datasource._id });
		const metadata = await webuntisMetadataModel.create({
			datasourceRunId: run._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'mathe',
		});

		const result = await webuntisMetadataService.remove(metadata._id);
		expect(result).to.not.be.undefined;

		const checkResult = await webuntisMetadataModel.findById(metadata._id);
		expect(checkResult).to.be.null;

		await datasourceRunModel.deleteOne({ _id: run._id }).lean().exec();
	});

	it('admin can FIND metadata for his run.');

	it('admin can GET metadata for his run.');

	it('admin can not FIND metadata belonging to a different scool');

	it('admin can not GET metadata belonging to a different scool');

	it('admin can not CREATE metadata');

	it('admin can not REMOVE metadata');

	it('admin can not UPDATE metadata');

	it('admin can not PATCH metadata');
});
