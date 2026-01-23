import { createMock, DeepMocked } from '@golevelup/ts-jest/lib/mocks';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PPlayer, IPlayerModel } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from '../../h5p-editor.const';
import { h5pContentFactory } from '../../testing';

const buildContent = () => {
	const contentId = new ObjectId(0).toString();
	const notExistingContentId = new ObjectId(1).toString();

	// @ts-expect-error partial object
	const playerResult: IPlayerModel = {
		contentId,
		dependencies: [],
		downloadPath: '',
		embedTypes: ['iframe'],
		scripts: ['example.js'],
		styles: ['example.css'],
	};

	return { contentId, notExistingContentId, playerResult };
};

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let h5pPlayer: DeepMocked<H5PPlayer>;
	let testApiClient: TestApiClient;
	let jwtConfig: TestJwtModuleConfig;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
		})
			.overrideProvider(H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5PPlayer)
			.useValue(createMock<H5PPlayer>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		h5pPlayer = module.get(H5PPlayer);
		await app.init();

		testApiClient = new TestApiClient(app, '/h5p-editor/play');
		em = module.get(EntityManager);
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
	});

	describe('get h5p player', () => {
		describe('when user is not logged in', () => {
			it('should return UNAUTHORIZED status', async () => {
				const mongoId = new ObjectId().toHexString();
				const response = await testApiClient.get(mongoId);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is not logged in', () => {
			describe('when content is existing', () => {
				const setup = async () => {
					const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();

					const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);

					const parentId = new ObjectId().toHexString();

					const h5pContent = h5pContentFactory.build({ parentId });

					await em.persist([h5pContent]).flush();
					em.clear();

					const { playerResult } = buildContent();

					h5pPlayer.render.mockResolvedValueOnce(playerResult);

					return { loggedInClient, contentId: h5pContent.id };
				};

				it('should return 200 status', async () => {
					const { loggedInClient, contentId } = await setup();

					const response = await loggedInClient.get(contentId);

					expect(response.status).toEqual(200);
				});
			});
		});

		describe('when content is not existing', () => {
			const setup = () => {
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();

				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);
				const contentId = new ObjectId().toHexString();

				return { loggedInClient, contentId };
			};

			it('should return 200 status', async () => {
				const { loggedInClient, contentId } = setup();

				const response = await loggedInClient.get(contentId);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when id is not a mongo id', () => {
			const setup = () => {
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();

				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);

				return { loggedInClient };
			};

			it('should return 400', async () => {
				const { loggedInClient } = setup();

				const response = await loggedInClient.get('123');

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});
	});
});
