const { expect } = require('chai');

const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);

const { webuntisMetadataModel } = require('../../../src/services/webuntis/model');

describe('webuntis metadata service', () => {
	let webuntisMetadataService;
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		webuntisMetadataService = app.service('webuntisMetadata');
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('registered the webuntis metadata service', () => {
		expect(app.service('webuntisMetadata')).to.not.be.undefined;
	});

	it('internal call can CREATE metadata', async () => {
		const datasource = await testObjects.createTestDatasource({
			config: { target: 'none' },
			name: 'datasource',
		});
		const createResult = await webuntisMetadataService.create({
			datasourceId: datasource._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'mathe',
			state: 'new',
		});
		expect(createResult).to.not.be.undefined;
		expect(createResult.datasourceId.toString()).to.equal(datasource._id.toString());

		await webuntisMetadataModel.deleteOne({ _id: createResult._id }).lean().exec();
	});

	it('internal call can FIND metadata', async () => {
		const datasource = await testObjects.createTestDatasource({
			config: { target: 'none' },
			name: 'datasource',
		});
		const metadata = await webuntisMetadataModel.create({
			datasourceId: datasource._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'deutsch',
			state: 'new',
		});

		const result = await webuntisMetadataService.find({ query: { datasourceId: datasource._id } });

		expect(result).to.not.be.undefined;
		expect(Array.isArray(result.data)).to.be.true;
		expect(result.total).to.eq(1);

		await webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
	});

	it('internal call can GET metadata', async () => {
		const datasource = await testObjects.createTestDatasource({
			config: { target: 'none' },
			name: 'datasource',
		});
		const metadata = await webuntisMetadataModel.create({
			datasourceId: datasource._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'sport',
			state: 'new',
		});

		const result = await webuntisMetadataService.get(metadata._id);

		expect(result).to.not.be.undefined;
		expect(result.datasourceId.toString()).to.eq(datasource._id.toString());

		await webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
	});

	it('internal call can PATCH metadata', async () => {
		const datasource = await testObjects.createTestDatasource({
			config: { target: 'none' },
			name: 'datasource',
		});
		const metadata = await webuntisMetadataModel.create({
			datasourceId: datasource._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'sport',
			state: 'new',
		});

		const result = await webuntisMetadataService.patch(metadata._id, { state: 'imported' });

		expect(result).to.not.be.undefined;
		expect(result.datasourceId.toString()).to.eq(datasource._id.toString());
		expect(result.state).to.equal('imported');

		await webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
	});

	it('internal call can REMOVE metadata', async () => {
		const datasource = await testObjects.createTestDatasource({
			config: { target: 'none' },
			name: 'datasource',
		});
		const metadata = await webuntisMetadataModel.create({
			datasourceId: datasource._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'kunst',
			state: 'new',
		});

		const result = await webuntisMetadataService.remove(metadata._id);
		expect(result).to.not.be.undefined;

		const checkResult = await webuntisMetadataModel.findById(metadata._id);
		expect(checkResult).to.be.null;
	});

	it('admin can FIND metadata belonging to his school.', async () => {
		const school = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const datasource = await testObjects.createTestDatasource({
			schoolId: admin.schoolId,
			config: { target: 'none' },
			name: 'datasource',
		});
		const metadata = await webuntisMetadataModel.create({
			datasourceId: datasource._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'Traumdeutung',
			state: 'new',
		});
		const params = await testObjects.generateRequestParamsFromUser(admin);
		params.query = { datasourceId: datasource._id };
		const result = await webuntisMetadataService.find(params);
		expect(result).to.not.be.undefined;
		expect(Array.isArray(result.data)).to.be.true;
		expect(result.total).to.eq(1);
		expect(result.data[0].datasourceId.toString()).to.eq(datasource._id.toString());

		await webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
	});

	it('admin can not GET metadata.', async () => {
		const school = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const datasource = await testObjects.createTestDatasource({
			schoolId: admin.schoolId,
			config: { target: 'none' },
			name: 'datasource',
		});
		const metadata = await webuntisMetadataModel.create({
			datasourceId: datasource._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'physik',
			state: 'new',
		});
		const params = await testObjects.generateRequestParamsFromUser(admin);
		try {
			await webuntisMetadataService.get(metadata._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(405);
		}
		await webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
	});

	it('admin can not FIND metadata belonging to a different scool', async () => {
		const userSchool = await testObjects.createTestSchool();
		const datasourceSchool = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: userSchool._id });
		const datasource = await testObjects.createTestDatasource({
			schoolId: datasourceSchool._id,
			config: { target: 'none' },
			name: 'datasource',
		});
		const metadata = await webuntisMetadataModel.create({
			datasourceId: datasource._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'Telekinetik',
			state: 'new',
		});
		const params = await testObjects.generateRequestParamsFromUser(admin);
		params.query = { datasourceId: datasource._id };
		try {
			await webuntisMetadataService.find(params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(404);
		}

		await webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
	});

	it('admin can not CREATE metadata', async () => {
		const school = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const datasource = await testObjects.createTestDatasource({
			schoolId: admin.schoolId,
			config: { target: 'none' },
			name: 'datasource',
		});
		const params = await testObjects.generateRequestParamsFromUser(admin);
		try {
			const metadata = await webuntisMetadataService.create(
				{
					datasourceId: datasource._id,
					teacher: 'Renz',
					class: '2a',
					room: '0-23',
					subject: 'Verteidigung gegen die dunklen Künste',
					state: 'new',
				},
				params
			);
			await webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(405);
		}
	});

	it('admin can not REMOVE metadata', async () => {
		const school = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const datasource = await testObjects.createTestDatasource({
			schoolId: admin.schoolId,
			config: { target: 'none' },
			name: 'datasource',
		});
		const metadata = await webuntisMetadataModel.create({
			datasourceId: datasource._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'physik',
			state: 'new',
		});
		const params = await testObjects.generateRequestParamsFromUser(admin);
		try {
			await webuntisMetadataService.remove(metadata._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(405);
		}
		await webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
	});

	it('admin can not UPDATE metadata', async () => {
		const school = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const datasource = await testObjects.createTestDatasource({
			schoolId: admin.schoolId,
			config: { target: 'none' },
			name: 'datasource',
		});
		const metadata = await webuntisMetadataModel.create({
			datasourceId: datasource._id,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'Darstellendes Spiel',
			state: 'new',
		});
		const params = await testObjects.generateRequestParamsFromUser(admin);
		try {
			await webuntisMetadataService.update(metadata._id, { room: 'Olympiastadion' }, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(405);
		}
		await webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
	});

	it('admin can not PATCH metadata', async () => {
		const school = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const datasource = await testObjects.createTestDatasource({
			schoolId: admin.schoolId,
			config: { target: 'none' },
			name: 'datasource',
		});
		const metadata = await webuntisMetadataModel.create({
			datasourceId: datasource._id,
			teacher: 'Snape',
			class: '2',
			room: 'Kerker',
			subject: 'Zaubertränke',
			state: 'new',
		});
		const params = await testObjects.generateRequestParamsFromUser(admin);
		try {
			await webuntisMetadataService.patch(metadata._id, { teacher: 'Slughorn' }, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(405);
		}
		await webuntisMetadataModel.deleteOne({ _id: metadata._id }).lean().exec();
	});
});
