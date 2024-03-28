import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SchoolEntity, SystemEntity } from '@shared/domain/entity';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	countyEmbeddableFactory,
	federalStateFactory,
	schoolEntityFactory,
	schoolYearFactory,
	systemEntityFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';

describe('School Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'school');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('PATCH /:id', () => {
		describe('when user is not logged in', () => {
			it('should return 401', async () => {
				const id = new ObjectId().toHexString();

				const response = await testApiClient.patch(id).send({
					name: 'new name',
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when user is an admin', () => {
				describe('when request is not valid', () => {
					const setup = async () => {
						const school = schoolEntityFactory.build();
						const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

						await em.persistAndFlush([adminAccount, adminUser, school]);
						em.clear();

						const loggedInClient = await testApiClient.login(adminAccount);

						return { loggedInClient, school };
					};

					describe('when id in params is not a mongo id', () => {
						it('should return 400', async () => {
							const { loggedInClient } = await setup();

							const response = await loggedInClient.get(`id/123`);

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							expect(response.body).toEqual(
								expect.objectContaining({
									validationErrors: [{ errors: ['schoolId must be a mongodb id'], field: ['schoolId'] }],
								})
							);
						});
					});

					describe('when requested school is not found', () => {
						it('should return 404', async () => {
							const { loggedInClient } = await setup();

							const response = await loggedInClient.patch(new ObjectId().toHexString()).send({
								name: 'new name',
							});

							expect(response.status).toEqual(HttpStatus.NOT_FOUND);
						});
					});

					describe('when FileStorageType param is not valid', () => {
						it('should return 400', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								fileStorageType: 'invalid',
							});

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							expect(response.body).toEqual(
								expect.objectContaining({
									validationErrors: [
										{
											errors: ['fileStorageType must be one of the following values: awsS3'],
											field: ['fileStorageType'],
										},
									],
								})
							);
						});
					});

					describe('when language param is not valid', () => {
						it('should return 400', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								language: 'invalid',
							});

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							expect(response.body).toEqual(
								expect.objectContaining({
									validationErrors: [
										{ errors: ['language must be one of the following values: de, en, es, uk'], field: ['language'] },
									],
								})
							);
						});
					});

					describe('when officialSchoolNumber param is not valid', () => {
						it('should return 400', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								officialSchoolNumber: 'invalid school number',
							});

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							expect(response.body).toEqual(
								expect.objectContaining({
									validationErrors: [
										{
											errors: ['officialSchoolNumber must match /^[a-zA-Z0-9-]+$/ regular expression'],
											field: ['officialSchoolNumber'],
										},
									],
								})
							);
						});
					});

					describe('when countyId in params is not a mongodb id', () => {
						it('should return 400', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								countyId: 'invalidId',
							});

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							expect(response.body).toEqual(
								expect.objectContaining({
									validationErrors: [{ errors: ['countyId must be a mongodb id'], field: ['countyId'] }],
								})
							);
						});
					});

					describe.skip('when enableStudentTeamCreation in params is not a boolean', () => {
						it('should return 400', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								enableStudentTeamCreation: '123',
							});

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							expect(response.body).toEqual(
								expect.objectContaining({
									validationErrors: [
										{
											errors: ['enableStudentTeamCreation must be a boolean value'],
											field: ['enableStudentTeamCreation'],
										},
									],
								})
							);
						});
					});

					describe('when features param is not valid', () => {
						it('should return 400', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								features: 'invalid',
							});

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							expect(response.body).toEqual(
								expect.objectContaining({
									validationErrors: [
										{
											errors: [
												'each value in features must be one of the following values: rocketChat, videoconference, nextcloud, studentVisibility, ldapUniventionMigrationSchool, oauthProvisioningEnabled, showOutdatedUsers, enableLdapSyncDuringMigration',
											],
											field: ['features'],
										},
									],
								})
							);
						});
					});

					describe('when permissions param is not valid', () => {
						it('should return 400', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								permissions: {
									teacher: {
										invalid: 'invalid',
									},
									student: {
										invalid: 'invalid',
									},
								},
							});

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							expect(response.body).toEqual(
								expect.objectContaining({
									validationErrors: [
										{
											errors: ['STUDENT_LIST must be a boolean value'],
											field: ['permissions', 'teacher', 'STUDENT_LIST'],
										},
										{
											errors: ['LERNSTORE_VIEW must be a boolean value'],
											field: ['permissions', 'student', 'LERNSTORE_VIEW'],
										},
									],
								})
							);
						});
					});
				});

				describe('when request is valid', () => {
					describe('when the school is not the user´s school', () => {
						const setup = async () => {
							const adminsSchool = schoolEntityFactory.build();
							const otherSchool = schoolEntityFactory.build();
							const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school: adminsSchool });

							await em.persistAndFlush([adminAccount, adminUser, adminsSchool, otherSchool]);
							em.clear();

							const loggedInClient = await testApiClient.login(adminAccount);

							return { loggedInClient, otherSchool };
						};

						it('should return FORBIDDEN', async () => {
							const { loggedInClient, otherSchool } = await setup();

							const response = await loggedInClient.patch(otherSchool.id).send({
								name: 'new name',
							});

							expect(response.status).toEqual(HttpStatus.FORBIDDEN);
						});
					});

					describe('when the school is the user´s school', () => {
						const setup = async () => {
							const schoolYears = schoolYearFactory.withStartYear(2002).buildList(3);
							const currentYear = schoolYears[1];
							const federalState = federalStateFactory.build();
							const county = countyEmbeddableFactory.build();
							const systems = systemEntityFactory.buildList(3);
							const school = schoolEntityFactory.build({ currentYear, federalState, systems, county });
							const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

							await em.persistAndFlush([...schoolYears, federalState, adminAccount, adminUser, school]);
							em.clear();

							const loggedInClient = await testApiClient.login(adminAccount);

							const newParams = {
								name: 'new name',
								officialSchoolNumber: 'new-school-number',
								logo: {
									dataUrl: 'new logo data url',
									name: 'new logo name',
								},
								fileStorageType: 'awsS3',
								language: 'en',
								features: ['rocketChat'],
							};

							const schoolYearResponses = schoolYears.map((schoolYear) => {
								return {
									id: schoolYear.id,
									name: schoolYear.name,
									startDate: schoolYear.startDate.toISOString(),
									endDate: schoolYear.endDate.toISOString(),
								};
							});

							const expectedResponse = {
								id: school.id,
								createdAt: school.createdAt.toISOString(),
								updatedAt: school.updatedAt.toISOString(),
								federalState: {
									id: federalState.id,
									name: federalState.name,
									abbreviation: federalState.abbreviation,
									logoUrl: federalState.logoUrl,
									counties: federalState.counties?.map((item) => {
										return {
											id: item._id.toHexString(),
											name: item.name,
											countyId: item.countyId,
											antaresKey: item.antaresKey,
										};
									}),
								},
								county: {
									id: county._id.toHexString(),
									name: county.name,
									countyId: county.countyId,
									antaresKey: county.antaresKey,
								},
								inMaintenance: false,
								isExternal: false,
								currentYear: schoolYearResponses[1],
								years: {
									schoolYears: schoolYearResponses,
									activeYear: schoolYearResponses[1],
									lastYear: schoolYearResponses[0],
									nextYear: schoolYearResponses[2],
								},
								name: newParams.name,
								features: ['rocketChat'],
								systemIds: systems.map((system) => system.id),
								language: newParams.language,
								fileStorageType: newParams.fileStorageType,
								logo: newParams.logo,
								officialSchoolNumber: newParams.officialSchoolNumber,
								instanceFeatures: ['isTeamCreationByStudentsEnabled'],
							};

							return { loggedInClient, school, expectedResponse, newParams };
						};

						it('should update school', async () => {
							const { loggedInClient, school, expectedResponse, newParams } = await setup();

							const response = await loggedInClient.patch(school.id).send(newParams);

							expect(response.status).toEqual(HttpStatus.OK);
							expect(response.body).toEqual(expectedResponse);

							const updatedSchool = await em.findOne(SchoolEntity, { id: school.id });
							const { logo, ...expectedParams } = newParams;

							expect(updatedSchool).toEqual(
								expect.objectContaining({ ...expectedParams, logo_name: logo.name, logo_dataUrl: logo.dataUrl })
							);
						});

						it('should not update school', async () => {
							const { loggedInClient, school } = await setup();

							const firstResponse = await loggedInClient.get(`id/${school.id}`);
							const response = await loggedInClient.patch(school.id).send({});

							expect(response.status).toEqual(HttpStatus.OK);
							expect(response.body).toEqual(firstResponse.body);
						});
					});
				});
			});

			describe('when user is a teacher', () => {
				const setup = async () => {
					const school = schoolEntityFactory.build();
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

					await em.persistAndFlush([teacherAccount, teacherUser, school]);
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					return { loggedInClient, school };
				};

				it('should return FORBIDDEN', async () => {
					const { loggedInClient, school } = await setup();

					const response = await loggedInClient.patch(school.id).send({
						name: 'new name',
					});

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when user is a student', () => {
				const setup = async () => {
					const school = schoolEntityFactory.build();
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });

					await em.persistAndFlush([studentAccount, studentUser, school]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					return { loggedInClient, school };
				};

				it('should return FORBIDDEN', async () => {
					const { loggedInClient, school } = await setup();

					const response = await loggedInClient.patch(school.id).send({
						name: 'new name',
					});

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});
		});
	});

	describe('PATCH /schoolId/:schoolId/systemId/:systemId/remove', () => {
		describe('when user is not logged in', () => {
			it('should return 401', async () => {
				const someSchoolId = new ObjectId().toHexString();
				const someSystemId = new ObjectId().toHexString();

				const response = await testApiClient.patch(`/schoolId/${someSchoolId}/systemId/${someSystemId}/remove`).send({
					name: 'new name',
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when user is an admin with needed permissions and the system is not deletable', () => {
				const setup = async () => {
					const system = systemEntityFactory.build({ ldapConfig: {} });
					const school = schoolEntityFactory.build({ systems: [system] });
					const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

					await em.persistAndFlush([adminAccount, adminUser, school, system]);
					em.clear();

					const loggedInClient = await testApiClient.login(adminAccount);

					return { loggedInClient, school, system };
				};

				it('should remove the given systemId from the systemIds of the school but not the system itself', async () => {
					const { loggedInClient, school, system } = await setup();

					const response = await loggedInClient.patch(`schoolId/${school.id}/systemId/${system.id}/remove`);

					expect(response.status).toEqual(HttpStatus.OK);
					const updatedSchool = await em.findOne(SchoolEntity, { id: school.id });
					expect(updatedSchool?.systems.getIdentifiers()).not.toContain(system.id);
					const systemAfterUpdate = await em.findOne(SystemEntity, { id: system.id });
					expect(systemAfterUpdate).not.toBeNull();
				});
			});

			describe('when user is an admin with needed permissions and the system is deletable', () => {
				const setup = async () => {
					const system = systemEntityFactory.build({ ldapConfig: { provider: 'general' } });
					const school = schoolEntityFactory.build({ systems: [system] });
					const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

					await em.persistAndFlush([adminAccount, adminUser, school, system]);
					em.clear();

					const loggedInClient = await testApiClient.login(adminAccount);

					return { loggedInClient, school, system };
				};

				it('should remove the given systemId from the systemIds of the school and delete the system itself', async () => {
					const { loggedInClient, school, system } = await setup();

					const response = await loggedInClient.patch(`schoolId/${school.id}/systemId/${system.id}/remove`);

					expect(response.status).toEqual(HttpStatus.OK);
					const updatedSchool = await em.findOne(SchoolEntity, { id: school.id });
					expect(updatedSchool?.systems.getIdentifiers()).not.toContain(system.id);
					const systemAfterUpdate = await em.findOne(SystemEntity, { id: system.id });
					expect(systemAfterUpdate).toBeNull();
				});
			});
		});
	});
});
