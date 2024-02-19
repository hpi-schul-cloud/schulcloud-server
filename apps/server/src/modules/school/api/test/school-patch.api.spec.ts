import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections, schoolEntityFactory } from '@shared/testing';
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
				const response = await testApiClient.patch('id').send({
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
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							expect(response.body.validationErrors).toEqual([
								{ errors: ['schoolId must be a mongodb id'], field: ['schoolId'] },
							]);
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
						it('should return 404', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								fileStorageType: 'invalid',
							});

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							expect(response.body.validationErrors).toEqual([
								{ errors: ['fileStorageType must be one of the following values: awsS3'], field: ['fileStorageType'] },
							]);
						});
					});

					describe('when language param is not valid', () => {
						it('should return 404', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								language: 'invalid',
							});

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							expect(response.body.validationErrors).toEqual([
								{ errors: ['language must be one of the following values: de, en, es, uk'], field: ['language'] },
							]);
						});
					});

					describe('when features param is not valid', () => {
						it('should return 404', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								features: 'invalid',
							});

							expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							expect(response.body.validationErrors).toEqual([
								{
									errors: [
										'each value in features must be one of the following values: rocketChat, videoconference, nextcloud, studentVisibility, ldapUniventionMigrationSchool, oauthProvisioningEnabled, showOutdatedUsers, enableLdapSyncDuringMigration, isTeamCreationByStudentsEnabled',
									],
									field: ['features'],
								},
							]);
						});
					});
				});

				describe('when request is valid', () => {
					describe('when school is not admins school', () => {
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
					describe('when school is admins school', () => {
						const setup = async () => {
							const school = schoolEntityFactory.build();
							const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

							await em.persistAndFlush([adminAccount, adminUser, school]);
							em.clear();

							const loggedInClient = await testApiClient.login(adminAccount);

							return { loggedInClient, school };
						};

						it('should update school', async () => {
							const { loggedInClient, school } = await setup();

							const response = await loggedInClient.patch(school.id).send({
								name: 'new name',
							});

							expect(response.status).toEqual(HttpStatus.OK);
							expect(response.body).toContain({
								id: school.id,
								name: 'new name',
							});

							const updatedSchool = await em.findOne(SchoolEntity, { id: school.id });
							expect(updatedSchool?.name).toEqual('new name');
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
});
