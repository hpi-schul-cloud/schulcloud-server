import { CoreModule } from '@core/core.module';
import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientAdapter,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { CourseEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { StorageProviderEntity, StorageProviderRepo } from '@modules/school/repo';
import { storageProviderFactory } from '@modules/school/testing';
import { teamFactory } from '@modules/team/testing';
import { User } from '@modules/user/repo';
import { ForbiddenException, HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { Readable } from 'stream';
import { DownloadArchiveService, OwnerType } from '../../domain';
import { FileEntity } from '../../entity/file.entity';
import { fileEntityFactory } from '../../entity/testing/factory/file-entity.factory';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig } from '../../legacy-file-archive.config';
import { FilesRepo } from '../../repo';
import { DownloadArchiveController } from '../download-archive.controller';
import { DownloadArchiveUC } from '../download-archive.uc';

describe('DownloadArchive Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let jwtConfig: TestJwtModuleConfig;
	let config: LegacyFileArchiveConfig;
	let authorizationClient: DeepMocked<AuthorizationClientAdapter>;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [
				CoreModule,
				LoggerModule,
				AuthorizationClientModule.register(AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig),
				AuthGuardModule.register([
					{
						option: AuthGuardOptions.JWT,
						configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
						configConstructor: JwtAuthGuardConfig,
					},
				]),
				ErrorModule,
				MongoMemoryDatabaseModule.forRoot({
					entities: [FileEntity, StorageProviderEntity, User, CourseEntity],
				}),
				ConfigurationModule.register(LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig),
				ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig),
			],
			controllers: [DownloadArchiveController],
			providers: [DownloadArchiveService, DownloadArchiveUC, StorageProviderRepo, FilesRepo],
		})
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		jwtConfig = moduleFixture.get(TEST_JWT_CONFIG_TOKEN);
		testApiClient = new TestApiClient(app, 'download-archive');
		config = moduleFixture.get(LEGACY_FILE_ARCHIVE_CONFIG_TOKEN);
		authorizationClient = moduleFixture.get(AuthorizationClientAdapter);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('downloadFilesAsArchive', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const params = {
					ownerId: '507f1f77bcf86cd799439011',
					ownerType: OwnerType.Team,
					archiveName: 'test-archive.zip',
				};

				const response = await testApiClient.post('download-files-as-archive', params);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when ownerId in params is not a mongo id', () => {
			const setup = () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				return { loggedInClient };
			};

			it('should return 400', async () => {
				const { loggedInClient } = setup();
				const params = {
					ownerId: 'invalid-id',
					ownerType: OwnerType.Team,
					archiveName: 'test-archive.zip',
				};

				const response = await loggedInClient.post('download-files-as-archive', params);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(
					expect.objectContaining({
						validationErrors: [{ errors: ['ownerId must be a mongodb id'], field: ['ownerId'] }],
					})
				);
			});
		});

		describe('when ownerType is invalid', () => {
			const setup = () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				return { loggedInClient };
			};

			it('should return 400', async () => {
				const { loggedInClient } = setup();
				const params = {
					ownerId: '507f1f77bcf86cd799439011',
					ownerType: 'invalid-type',
					archiveName: 'test-archive.zip',
				};

				const response = await loggedInClient.post('download-files-as-archive', params);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(
					expect.objectContaining({
						validationErrors: [
							{
								errors: ['ownerType must be one of the following values: user, course, teams'],
								field: ['ownerType'],
							},
						],
					})
				);
			});
		});

		describe('when feature is not enabled', () => {
			const setup = () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				config.featureTeamArchiveDownload = false;

				return { loggedInClient };
			};

			it('should return 501', async () => {
				const { loggedInClient } = setup();
				const params = {
					ownerId: '507f1f77bcf86cd799439011',
					ownerType: OwnerType.Team,
					archiveName: 'test-archive.zip',
				};

				const response = await loggedInClient.post('download-files-as-archive', params);

				expect(response.status).toEqual(HttpStatus.NOT_IMPLEMENTED);

				config.featureTeamArchiveDownload = true;
			});
		});

		describe('when user does not have permission to access the team', () => {
			const setup = () => {
				const team = teamFactory.buildWithId();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				authorizationClient.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				return { teamId: team.id, loggedInClient };
			};

			it('should return 403', async () => {
				const { teamId, loggedInClient } = setup();
				const params = {
					ownerId: teamId,
					ownerType: OwnerType.Team,
					archiveName: 'team-archive.zip',
				};

				const response = await loggedInClient.post('download-files-as-archive', params);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when user does not have permission to access the course', () => {
			const setup = () => {
				const course = courseEntityFactory.buildWithId();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				authorizationClient.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				return { courseId: course.id, loggedInClient };
			};

			it('should return 403', async () => {
				const { courseId, loggedInClient } = setup();
				const params = {
					ownerId: courseId,
					ownerType: OwnerType.Course,
					archiveName: 'course-archive.zip',
				};

				const response = await loggedInClient.post('download-files-as-archive', params);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when user does not have permission to access another user', () => {
			const setup = () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const { studentUser: otherStudentUser } = UserAndAccountTestFactory.buildStudent();

				authorizationClient.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				return { otherUserId: otherStudentUser.id, loggedInClient };
			};

			it('should return 403', async () => {
				const { otherUserId, loggedInClient } = setup();
				const params = {
					ownerId: otherUserId,
					ownerType: OwnerType.User,
					archiveName: 'user-archive.zip',
				};

				const response = await loggedInClient.post('download-files-as-archive', params);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when user successfully downloads team archive', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const team = teamFactory.withRoleAndUserId(teacherUser.roles[0], teacherUser.id).buildWithId();

				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);
				const archiveName = 'team-files.zip';

				const storageProvider = storageProviderFactory.buildWithId({ region: 'us-east-1' });
				await em.persist(storageProvider).flush();

				const file1 = fileEntityFactory.build({
					name: 'team-doc.pdf',
					ownerId: team.id,
					refOwnerModel: OwnerType.Team,
					storageProvider,
					isDirectory: false,
				});
				const file2 = fileEntityFactory.build({
					name: 'notes.txt',
					ownerId: team.id,
					refOwnerModel: OwnerType.Team,
					storageProvider,
					isDirectory: false,
				});
				await em.persist([file1, file2]).flush();
				em.clear();

				jest.spyOn(S3ClientAdapter.prototype, 'get').mockResolvedValue({
					data: Readable.from('mock file content'),
					contentType: 'application/octet-stream',
					contentLength: 100,
					etag: 'mock-etag',
				});

				return { teamId: team.id, loggedInClient, archiveName };
			};

			it('should return 200 with archive file', async () => {
				const { teamId, loggedInClient, archiveName } = await setup();
				const params = {
					ownerId: teamId,
					ownerType: OwnerType.Team,
					archiveName,
				};

				const response = await loggedInClient.post('download-files-as-archive', params);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.headers['content-type']).toContain('application/zip');
			});
		});

		describe('when user successfully downloads course archive', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseEntityFactory.buildWithId({ teachers: [teacherUser] });

				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);
				const archiveName = 'course-files.zip';

				const storageProvider = storageProviderFactory.buildWithId({ region: 'us-east-1' });
				await em.persist(storageProvider).flush();

				const file1 = fileEntityFactory.build({
					name: 'syllabus.pdf',
					ownerId: course.id,
					refOwnerModel: OwnerType.Course,
					storageProvider,
					isDirectory: false,
				});
				const file2 = fileEntityFactory.build({
					name: 'lecture.pptx',
					ownerId: course.id,
					refOwnerModel: OwnerType.Course,
					storageProvider,
					isDirectory: false,
				});
				await em.persist([file1, file2]).flush();

				jest.spyOn(S3ClientAdapter.prototype, 'get').mockResolvedValue({
					data: Readable.from('mock file content'),
					contentType: 'application/octet-stream',
					contentLength: 100,
					etag: 'mock-etag',
				});

				return { courseId: course.id, loggedInClient, archiveName };
			};

			it('should return 200 with archive file', async () => {
				const { courseId, loggedInClient, archiveName } = await setup();
				const params = {
					ownerId: courseId,
					ownerType: OwnerType.Course,
					archiveName,
				};

				const response = await loggedInClient.post('download-files-as-archive', params);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.headers['content-type']).toContain('application/zip');
			});
		});

		describe('when user successfully downloads user archive', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);
				const archiveName = 'user-files.zip';

				const storageProvider = storageProviderFactory.buildWithId({ region: 'us-east-1' });
				await em.persist(storageProvider).flush();

				const file1 = fileEntityFactory.build({
					name: 'personal-doc.docx',
					ownerId: teacherUser.id,
					refOwnerModel: OwnerType.User,
					storageProvider,
					isDirectory: false,
				});
				const file2 = fileEntityFactory.build({
					name: 'photo.jpg',
					ownerId: teacherUser.id,
					refOwnerModel: OwnerType.User,
					storageProvider,
					isDirectory: false,
				});
				await em.persist([file1, file2]).flush();

				jest.spyOn(S3ClientAdapter.prototype, 'get').mockResolvedValue({
					data: Readable.from('mock file content'),
					contentType: 'application/octet-stream',
					contentLength: 100,
					etag: 'mock-etag',
				});

				return { userId: teacherUser.id, loggedInClient, archiveName };
			};

			it('should return 200 with archive file', async () => {
				const { userId, loggedInClient, archiveName } = await setup();
				const params = {
					ownerId: userId,
					ownerType: OwnerType.User,
					archiveName,
				};

				const response = await loggedInClient.post('download-files-as-archive', params);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.headers['content-type']).toContain('application/zip');
			});
		});

		describe('when request includes Range header for partial content', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);
				const archiveName = 'team-files.zip';

				const storageProvider = storageProviderFactory.buildWithId({ region: 'us-east-1' });
				await em.persist(storageProvider).flush();

				const file1 = fileEntityFactory.build({
					name: 'team-doc.pdf',
					ownerId: teacherUser.id,
					refOwnerModel: OwnerType.User,
					storageProvider,
					isDirectory: false,
				});
				await em.persist([file1]).flush();

				const mockContent = 'mock file content for range request';
				const contentRange = 'bytes 0-99/1000';

				jest.spyOn(S3ClientAdapter.prototype, 'get').mockResolvedValue({
					data: Readable.from(mockContent),
					contentType: 'application/zip',
					contentLength: 100,
					contentRange,
					etag: 'mock-etag',
				});

				return { userId: teacherUser.id, loggedInClient, archiveName, contentRange };
			};

			it('should return 200 status (currently does not implement range request handling)', async () => {
				const { userId, loggedInClient, archiveName } = await setup();
				const params = {
					ownerId: userId,
					ownerType: OwnerType.User,
					archiveName,
				};

				const response = await loggedInClient.post('download-files-as-archive', params).set('Range', 'bytes=0-99');

				// Note: Currently returns 200 because bytesRange parameter is not passed to streamFileToClient
				// When range request handling is fully implemented, this should return 206
				expect(response.status).toEqual(HttpStatus.OK);
			});
		});
	});
});
