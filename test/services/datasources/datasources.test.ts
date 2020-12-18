import { expect } from 'chai';

import appPromise from '../../../src/app';
import testObjectsImport from '../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);
import loginImport from '../helpers/services/login'; 
const { generateRequestParamsFromUser } = loginImport(appPromise);
import { datasourceModel } from '../../../src/services/datasources/model';


describe('datasources service', () => {
	let app;
	let datasourcesService;
	let server;
	before(async () => {
		app = await appPromise;
		datasourcesService = app.service('datasources');
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('registered the datasources service', () => {
		expect(datasourcesService).to.not.be.undefined;
	});

	it('CREATE a new datasource', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const data = {
			config: { target: 'csv' },
			name: `test${Date.now()}`,
		};
		const result = await datasourcesService.create(data, params);
		expect(result).to.not.be.undefined;
		expect(result.config).to.exist;
		expect(result.config).to.haveOwnProperty('target');
		expect(result.name).to.exist;
		expect(result.createdBy.toString()).to.equal(admin._id.toString());
		expect(result.schoolId.toString()).to.equal(admin.schoolId.toString());
		datasourceModel.deleteOne({ _id: result._id }).lean().exec();
	});

	it('protects fields', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const data = {
			config: { target: 'csv', csvpassword: 'secure123' },
			name: `test${Date.now()}`,
			protected: ['csvpassword'],
		};
		const datasource = await datasourcesService.create(data, params);
		params.query = {};
		const result = await datasourcesService.get(datasource._id, params);
		expect(result).to.not.be.undefined;
		expect(result.config).to.exist;
		expect(result.config.csvpassword).to.not.eq('secure123');
		expect(result.protected).to.not.be.undefined;
		datasourceModel.deleteOne({ _id: result._id }).lean().exec();
	});

	it('GET a datasource', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const data = {
			config: { target: 'csv' },
			name: `test${Date.now()}`,
		};
		const datasource = await datasourcesService.create(data, params);
		params.query = {};
		const result = await datasourcesService.get(datasource._id, params);
		expect(result).to.not.be.undefined;
		expect(result.config).to.exist;
		expect(result.config).to.haveOwnProperty('target');
		expect(result.name).to.exist;
		expect(result.createdBy.toString()).to.equal(admin._id.toString());
		expect(result.schoolId.toString()).to.equal(admin.schoolId.toString());
		datasourceModel.deleteOne({ _id: result._id }).lean().exec();
	});

	it('protected fields are protected', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const data = {
			config: {
				target: 'csv',
				password: 'didumm',
				secret: 'Im an agent',
				public: 'im an expert',
			},
			name: `test${Date.now()}`,
			protected: ['password', 'secret'],
		};
		const datasource = await datasourcesService.create(data, params);
		params.query = {};
		const result = await datasourcesService.get(datasource._id, params);
		expect(result).to.not.be.undefined;
		expect(result.config).to.exist;
		expect(result.config.password).to.equal('<secret>');
		expect(result.config.secret).to.equal('<secret>');
		expect(result.config.public).to.equal('im an expert');
		await datasourceModel.deleteOne({ _id: result._id }).lean().exec();
	});

	it('cant circumvent protection via $select', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const data = {
			config: {
				target: 'csv',
				secret: 'Im an agent',
				public: 'im an expert',
			},
			name: `test${Date.now()}`,
			protected: ['secret'],
		};
		const datasource = await datasourcesService.create(data, params);
		params.query = { $select: ['config', 'schoolId'] };
		const result = await datasourcesService.get(datasource._id, params);
		expect(result).to.not.be.undefined;
		expect(result.config).to.exist;
		expect(result.config.secret).to.equal('<secret>');
		expect(result.config.public).to.equal('im an expert');
		await datasourceModel.deleteOne({ _id: result._id }).lean().exec();
	});

	it('FIND all datasources of the users school', async () => {
		const school = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const params = await generateRequestParamsFromUser(admin);

		const datasource01 = await datasourcesService.create(
			{
				config: { target: 'csv' },
				name: `onetest${Date.now()}`,
			},
			params
		);
		const datasource02 = await datasourcesService.create(
			{
				config: { target: 'csv' },
				name: `othertest${Date.now()}`,
			},
			params
		);

		params.query = {};
		const result = await datasourcesService.find(params);
		expect(result).to.not.be.undefined;
		expect(Array.isArray(result.data)).to.equal(true);
		expect(result.total).to.equal(2);
		const Ids = result.data.map((ds) => ds._id.toString());
		expect(Ids).to.include(datasource01._id.toString());
		expect(Ids).to.include(datasource02._id.toString());
		datasourceModel.deleteOne({ _id: datasource01._id }).lean().exec();
		datasourceModel.deleteOne({ _id: datasource02._id }).lean().exec();
	});

	it('PATCH a datasource', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const data = {
			config: { target: 'csv' },
			name: `test${Date.now()}`,
		};
		const datasource = await datasourcesService.create(data, params);
		const name = `renamedTest${Date.now()}`;
		const result = await datasourcesService.patch(datasource._id, { name }, params);
		expect(result).to.not.be.undefined;
		expect(result.config).to.exist;
		expect(result.config).to.haveOwnProperty('target');
		expect(result.name).to.equal(name);
		expect(result.createdBy.toString()).to.equal(admin._id.toString());
		expect(result.schoolId.toString()).to.equal(admin.schoolId.toString());
		datasourceModel.deleteOne({ _id: datasource._id }).lean().exec();
	});

	it('disallow UPDATE on a datasource', async () => {
		let datasource;
		try {
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const params = await generateRequestParamsFromUser(admin);
			const data = {
				config: { target: 'csv' },
				name: `test${Date.now()}`,
			};
			datasource = await datasourcesService.create(data, params);
			await datasourcesService.update(datasource._id, data, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(405);
			expect(err.className).to.equal('method-not-allowed');
			datasourceModel.deleteOne({ _id: datasource._id }).lean().exec();
		}
	});

	it('REMOVE a datasource', async () => {
		try {
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const params = await generateRequestParamsFromUser(admin);
			params.query = {};
			const data = {
				config: { target: 'csv' },
				name: `test${Date.now()}`,
			};
			const datasource = await datasourcesService.create(data, params);
			const removeResult = await datasourcesService.remove(datasource._id, params);
			expect(removeResult).to.not.be.undefined;
			await datasourcesService.get(datasource._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(404);
		}
	});

	it('fails for student', async () => {
		try {
			const admin = await testObjects.createTestUser({ roles: ['student'] });
			const params = await generateRequestParamsFromUser(admin);
			params.query = {};
			const data = {
				config: { target: 'csv' },
				name: `test${Date.now()}`,
			};
			await datasourcesService.create(data, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: DATASOURCES_CREATE.");
		}
	});

	it('fails for teacher', async () => {
		try {
			const admin = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await generateRequestParamsFromUser(admin);
			params.query = {};
			const data = {
				config: { target: 'csv' },
				name: `test${Date.now()}`,
			};
			await datasourcesService.create(data, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: DATASOURCES_CREATE.");
		}
	});

	it('fails for different school', async () => {
		let datasource;
		try {
			const firstSchool = await testObjects.createTestSchool();
			const otherSchool = await testObjects.createTestSchool();
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: firstSchool._id });
			const otherAdmin = await testObjects.createTestUser({
				roles: ['administrator'],
				schoolId: otherSchool._id,
			});
			const adminParams = await generateRequestParamsFromUser(admin);
			adminParams.query = {};
			const data = {
				config: { target: 'csv' },
				name: `test${Date.now()}`,
			};
			datasource = await datasourcesService.create(data, adminParams);

			const otherAdminParams = await generateRequestParamsFromUser(otherAdmin);
			otherAdminParams.query = {};
			await datasourcesService.get(datasource._id, otherAdminParams);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('You do not have valid permissions to access this.');
			datasourceModel.deleteOne({ _id: datasource._id }).lean().exec();
		}
	});
});
