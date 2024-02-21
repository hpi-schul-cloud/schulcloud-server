import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity, SystemEntity } from '@shared/domain/entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import {
	schoolSystemOptionsEntityFactory,
	systemEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { schoolEntityFactory } from '@shared/testing/factory/school-entity.factory';
import { SchoolSystemOptionsEntity } from '../../entity';
import { SchulConneXProvisioningOptionsResponse } from '../dto';

const baseRouteName = '/schools';

describe('School (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('[GET] /schools/:schoolId/systems/:systemId/provisioning-options', () => {
		describe('when an admin requests the configured options for a system at their school', () => {
			const setup = async () => {
				const system: SystemEntity = systemEntityFactory.buildWithId({
					provisioningStrategy: SystemProvisioningStrategy.SANIS,
				});
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
				});
				const schoolSystemOptions: SchoolSystemOptionsEntity = schoolSystemOptionsEntityFactory.buildWithId({
					system,
					school,
					provisioningOptions: {
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningOtherEnabled: true,
					},
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([school, adminAccount, adminUser, system, schoolSystemOptions]);
				em.clear();

				const adminClient = await testApiClient.login(adminAccount);

				return {
					adminClient,
					school,
					system,
				};
			};

			it('should return the options', async () => {
				const { adminClient, school, system } = await setup();

				const response = await adminClient.get(`/${school.id}/systems/${system.id}/provisioning-options`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<SchulConneXProvisioningOptionsResponse>({
					groupProvisioningClassesEnabled: true,
					groupProvisioningOtherEnabled: true,
					groupProvisioningCoursesEnabled: true,
				});
			});
		});

		describe('when the user is unauthorized', () => {
			const setup = async () => {
				const system: SystemEntity = systemEntityFactory.buildWithId({
					provisioningStrategy: SystemProvisioningStrategy.SANIS,
				});
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
				});
				const schoolSystemOptions: SchoolSystemOptionsEntity = schoolSystemOptionsEntityFactory.buildWithId({
					system,
					school,
					provisioningOptions: {
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningOtherEnabled: true,
					},
				});

				await em.persistAndFlush([school, system, schoolSystemOptions]);
				em.clear();

				return {
					school,
					system,
				};
			};

			it('should return unauthorized', async () => {
				const { school, system } = await setup();

				const response = await testApiClient.get(`/${school.id}/systems/${system.id}/provisioning-options`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});
	});

	describe('[POST] /schools/:schoolId/systems/:systemId/provisioning-options', () => {
		describe('when an admin requests the configured options for a system at their school', () => {
			const setup = async () => {
				const system: SystemEntity = systemEntityFactory.buildWithId({
					provisioningStrategy: SystemProvisioningStrategy.SANIS,
				});
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
				});
				const schoolSystemOptions: SchoolSystemOptionsEntity = schoolSystemOptionsEntityFactory.buildWithId({
					system,
					school,
					provisioningOptions: {
						groupProvisioningClassesEnabled: false,
						groupProvisioningCoursesEnabled: false,
						groupProvisioningOtherEnabled: false,
					},
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([school, adminAccount, adminUser, system, schoolSystemOptions]);
				em.clear();

				const adminClient = await testApiClient.login(adminAccount);

				return {
					adminClient,
					school,
					system,
					schoolSystemOptions,
				};
			};

			it('should create the entity', async () => {
				const { adminClient, school, system, schoolSystemOptions } = await setup();

				await adminClient.post(`/${school.id}/systems/${system.id}/provisioning-options`, {
					groupProvisioningClassesEnabled: true,
					groupProvisioningOtherEnabled: true,
					groupProvisioningCoursesEnabled: true,
				});

				expect(await em.findOne(SchoolSystemOptionsEntity, { id: schoolSystemOptions.id })).toEqual(
					expect.objectContaining({
						provisioningOptions: {
							groupProvisioningClassesEnabled: true,
							groupProvisioningOtherEnabled: true,
							groupProvisioningCoursesEnabled: true,
						},
					})
				);
			});

			it('should return the options', async () => {
				const { adminClient, school, system } = await setup();

				const response = await adminClient.post(`/${school.id}/systems/${system.id}/provisioning-options`, {
					groupProvisioningClassesEnabled: true,
					groupProvisioningOtherEnabled: true,
					groupProvisioningCoursesEnabled: true,
				});

				expect(response.status).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual<SchulConneXProvisioningOptionsResponse>({
					groupProvisioningClassesEnabled: true,
					groupProvisioningOtherEnabled: true,
					groupProvisioningCoursesEnabled: true,
				});
			});
		});

		describe('when the user is unauthorized', () => {
			const setup = async () => {
				const system: SystemEntity = systemEntityFactory.buildWithId({
					provisioningStrategy: SystemProvisioningStrategy.SANIS,
				});
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
				});

				await em.persistAndFlush([school, system]);
				em.clear();

				return {
					school,
					system,
				};
			};

			it('should return unauthorized', async () => {
				const { school, system } = await setup();

				const response = await testApiClient.post(`/${school.id}/systems/${system.id}/provisioning-options`, {
					groupProvisioningClassesEnabled: true,
					groupProvisioningCoursesEnabled: true,
					groupProvisioningOtherEnabled: true,
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});
	});
});
