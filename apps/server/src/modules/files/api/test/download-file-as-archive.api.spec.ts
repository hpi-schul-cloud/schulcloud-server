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
import { DownloadArchiveService, FileOwnerModel, LegacyFileStorageAdapter } from '../../domain';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig } from '../../legacy-file-archive.config';
import { fileDomainFactory } from '../../testing';
import { LegacyFileArchiveController } from '../download-archive.controller';
import { DownloadArchiveUC } from '../download-archive.uc';

describe('DownloadArchive Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let jwtConfig: TestJwtModuleConfig;
	let config: LegacyFileArchiveConfig;
	let authorizationClient: DeepMocked<AuthorizationClientAdapter>;
	let legacyFileStorageAdapter: DeepMocked<LegacyFileStorageAdapter>;

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
					entities: [StorageProviderEntity, User],
				}),
				ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig),
			],
			controllers: [LegacyFileArchiveController],
			providers: [
				DownloadArchiveService,
				DownloadArchiveUC,
				StorageProviderRepo,
				{
					provide: LegacyFileStorageAdapter,
					useValue: createMock<LegacyFileStorageAdapter>(),
				},
				{
					provide: LEGACY_FILE_ARCHIVE_CONFIG_TOKEN,
					useValue: { featureTeamArchiveDownload: true, legacyBaseUrl: 'http://localhost:3030' },
				},
			],
		})
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		jwtConfig = moduleFixture.get(TEST_JWT_CONFIG_TOKEN);
		testApiClient = new TestApiClient(app, 'filestorage/files/archive');
		config = moduleFixture.get(LEGACY_FILE_ARCHIVE_CONFIG_TOKEN);
		authorizationClient = moduleFixture.get(AuthorizationClientAdapter);
		legacyFileStorageAdapter = moduleFixture.get(LegacyFileStorageAdapter);
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
					ownerType: FileOwnerModel.TEAMS,
					archiveName: 'test-archive.zip',
				};

				const response = await testApiClient.get().query(params);

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
					ownerType: FileOwnerModel.TEAMS,
					archiveName: 'test-archive.zip',
				};

				const response = await loggedInClient.get().query(params);

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

				const response = await loggedInClient.get().query(params);

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
					ownerType: FileOwnerModel.TEAMS,
					archiveName: 'test-archive.zip',
				};

				const response = await loggedInClient.get().query(params);

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
					ownerType: FileOwnerModel.TEAMS,
					archiveName: 'team-archive.zip',
				};

				const response = await loggedInClient.get().query(params);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when user does not have permission to access the course', () => {
			const setup = () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				authorizationClient.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				return { loggedInClient };
			};

			it('should return 403', async () => {
				const { loggedInClient } = setup();
				const params = {
					ownerId: '507f1f77bcf86cd799439011',
					ownerType: FileOwnerModel.COURSE,
					archiveName: 'course-archive.zip',
				};

				const response = await loggedInClient.get().query(params);

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
					ownerType: FileOwnerModel.USER,
					archiveName: 'user-archive.zip',
				};

				const response = await loggedInClient.get().query(params);

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

				const file1 = fileDomainFactory.build({
					name: 'team-doc.pdf',
					storageProviderId: storageProvider.id,
					isDirectory: false,
				});
				const file2 = fileDomainFactory.build({
					name: 'notes.txt',
					storageProviderId: storageProvider.id,
					isDirectory: false,
				});

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);

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
					ownerType: FileOwnerModel.TEAMS,
					archiveName,
				};

				const response = await loggedInClient.get().query(params);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.headers['content-type']).toContain('application/zip');
			});
		});

		describe('when user successfully downloads course archive', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);
				const archiveName = 'course-files.zip';

				const storageProvider = storageProviderFactory.buildWithId({ region: 'us-east-1' });
				await em.persist(storageProvider).flush();

				const file1 = fileDomainFactory.build({
					name: 'syllabus.pdf',
					storageProviderId: storageProvider.id,
					isDirectory: false,
				});
				const file2 = fileDomainFactory.build({
					name: 'lecture.pptx',
					storageProviderId: storageProvider.id,
					isDirectory: false,
				});

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);

				jest.spyOn(S3ClientAdapter.prototype, 'get').mockResolvedValue({
					data: Readable.from('mock file content'),
					contentType: 'application/octet-stream',
					contentLength: 100,
					etag: 'mock-etag',
				});

				return { courseId: '507f1f77bcf86cd799439011', loggedInClient, archiveName };
			};

			it('should return 200 with archive file', async () => {
				const { courseId, loggedInClient, archiveName } = await setup();
				const params = {
					ownerId: courseId,
					ownerType: FileOwnerModel.COURSE,
					archiveName,
				};

				const response = await loggedInClient.get().query(params);

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

				const file1 = fileDomainFactory.build({
					name: 'personal-doc.docx',
					storageProviderId: storageProvider.id,
					isDirectory: false,
				});
				const file2 = fileDomainFactory.build({
					name: 'photo.jpg',
					storageProviderId: storageProvider.id,
					isDirectory: false,
				});

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);

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
					ownerType: FileOwnerModel.USER,
					archiveName,
				};

				const response = await loggedInClient.get().query(params);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.headers['content-type']).toContain('application/zip');
			});
		});
	});
});
