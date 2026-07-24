import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@modules/school/repo';
import {
	countyEmbeddableFactory,
	federalStateEntityFactory,
	schoolEntityFactory,
	schoolYearEntityFactory,
} from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { SystemEntity } from '@modules/system/repo';
import { systemEntityFactory } from '@modules/system/testing';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { SchoolErrorEnum } from '../../domain/loggable';

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

						await em.persist([adminAccount, adminUser, school]).flush();
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
											errors: [expect.stringContaining('each value in features must be one of the following values:')],
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

							await em.persist([adminAccount, adminUser, adminsSchool, otherSchool]).flush();
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
							const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(3);
							const currentYear = schoolYears[1];
							const federalState = federalStateEntityFactory.build();
							const county = countyEmbeddableFactory.build();
							const systems = systemEntityFactory.buildList(3);
							const school = schoolEntityFactory.build({ currentYear, federalState, systems, county });
							const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

							await em.persist([...schoolYears, federalState, adminAccount, adminUser, school]).flush();
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
								features: [],
							};

							const schoolYearResponses = schoolYears.map((schoolYear) => {
								return {
									id: schoolYear.id,
									name: schoolYear.name,
									startDate: schoolYear.startDate.toISOString(),
									endDate: schoolYear.endDate.toISOString(),
									courseCreationInNextYear: schoolYear.courseCreationInNextYear,
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
								features: [],
								systemIds: systems.map((system) => system.id),
								language: newParams.language,
								fileStorageType: newParams.fileStorageType,
								logo: newParams.logo,
								officialSchoolNumber: newParams.officialSchoolNumber,
								instanceFeatures: ['isTeamCreationByStudentsEnabled'],
							};

							return { loggedInClient, school, expectedResponse, newParams };
						};

						describe('when the request body is valid', () => {
							it('should return 200 and update school', async () => {
								const { loggedInClient, school, expectedResponse, newParams } = await setup();
								newParams.logo.dataUrl =
									'data:image/png;base64,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';
								const response = await loggedInClient.patch(school.id).send(newParams);

								expect(response.status).toEqual(HttpStatus.OK);
								expect(response.body).toEqual(expectedResponse);

								const updatedSchool = await em.findOne(SchoolEntity, { id: school.id });
								const { logo, ...expectedParams } = newParams;

								expect(updatedSchool).toEqual(
									expect.objectContaining({ ...expectedParams, logo_name: logo.name, logo_dataUrl: logo.dataUrl })
								);
							});
						});

						describe('when the request body is valid but the logo dataUrl is invalid', () => {
							it('should return 400', async () => {
								const { loggedInClient, school, newParams } = await setup();
								newParams.logo.dataUrl = 'invalid-data-url';
								const response = await loggedInClient.patch(school.id).send(newParams);

								expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							});
						});

						describe('when the request body is empty', () => {
							it('should return 200 but not update school', async () => {
								const { loggedInClient, school } = await setup();

								const firstResponse = await loggedInClient.get(`id/${school.id}`);
								const response = await loggedInClient.patch(school.id).send({});

								expect(response.status).toEqual(HttpStatus.OK);
								expect(response.body).toEqual(firstResponse.body);
							});
						});
					});
				});
			});

			describe('when user is a teacher', () => {
				const setup = async () => {
					const school = schoolEntityFactory.build();
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

					await em.persist([teacherAccount, teacherUser, school]).flush();
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

					await em.persist([studentAccount, studentUser, school]).flush();
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

	describe('PATCH /:schoolId/system/:systemId/remove', () => {
		describe('when user is not logged in', () => {
			it('should return 401', async () => {
				const someSchoolId = new ObjectId().toHexString();
				const someSystemId = new ObjectId().toHexString();

				const response = await testApiClient.patch(`/${someSchoolId}/system/${someSystemId}/remove`).send({
					name: 'new name',
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when user is an admin with needed permissions and the system is not deletable', () => {
				const setup = async () => {
					const system = systemEntityFactory.build({ ldapConfig: { provider: 'ldap' } });
					const school = schoolEntityFactory.build({ systems: [system] });
					const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

					await em.persist([adminAccount, adminUser, school, system]).flush();
					em.clear();

					const loggedInClient = await testApiClient.login(adminAccount);

					return { loggedInClient, school, system };
				};

				it('should remove the given systemId from the systemIds of the school but not the system itself', async () => {
					const { loggedInClient, school, system } = await setup();

					await loggedInClient.patch(`/${school.id}/system/${system.id}/remove`);
					const updatedSchool = await em.findOne(SchoolEntity, { id: school.id });
					expect(updatedSchool?.systems.getIdentifiers()).toContain(system.id);
					const systemAfterUpdate = await em.findOne(SystemEntity, { id: system.id });
					expect(systemAfterUpdate).not.toBeNull();
				});

				it('should throw SYSTEM_CAN_NOT_BE_DELETED error', async () => {
					const { loggedInClient, school, system } = await setup();

					const response = await loggedInClient.patch(`/${school.id}/system/${system.id}/remove`);
					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
					expect(response.body).toEqual(
						expect.objectContaining({
							type: SchoolErrorEnum.SYSTEM_CAN_NOT_BE_DELETED,
						})
					);
				});
			});

			describe('when user is an admin with needed permissions and the system is deletable', () => {
				const setup = async () => {
					const system = systemEntityFactory.build({ ldapConfig: { provider: 'general' } });
					const school = schoolEntityFactory.build({ systems: [system] });
					const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

					await em.persist([adminAccount, adminUser, school, system]).flush();
					em.clear();

					const loggedInClient = await testApiClient.login(adminAccount);

					return { loggedInClient, school, system };
				};

				it('should remove the given systemId from the systemIds of the school and delete the system itself', async () => {
					const { loggedInClient, school, system } = await setup();

					const response = await loggedInClient.patch(`/${school.id}/system/${system.id}/remove`);

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
