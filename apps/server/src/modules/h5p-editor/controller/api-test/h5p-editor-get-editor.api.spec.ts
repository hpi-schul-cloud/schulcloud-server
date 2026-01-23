import { createMock, DeepMocked } from '@golevelup/ts-jest/lib/mocks';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PEditor, IContentMetadata } from '@lumieducation/h5p-server';
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
	const badContentId = '';

	const editorModel = {
		scripts: ['example.js'],
		styles: ['example.css'],
	};

	const exampleContent = {
		h5p: createMock<IContentMetadata>(),
		library: 'ExampleLib-1.0',
		params: {
			metadata: createMock<IContentMetadata>(),
			params: { anything: true },
		},
	};

	return { contentId, notExistingContentId, badContentId, editorModel, exampleContent };
};

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;
	let em: EntityManager;
	let h5pEditor: DeepMocked<H5PEditor>;
	let jwtConfig: TestJwtModuleConfig;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
		})

			.overrideProvider(H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5PEditor)
			.useValue(createMock<H5PEditor>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();

		testApiClient = new TestApiClient(app, '/h5p-editor/edit');
		em = module.get(EntityManager);
		h5pEditor = module.get(H5PEditor);
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
	});

	describe('get new h5p editor', () => {
		describe('when user is not logged in', () => {
			it('should return UNAUTHORIZED status', async () => {
				const response = await testApiClient.get('de');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when editor is created successfully', () => {
				const setup = () => {
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

					const { editorModel } = buildContent();
					h5pEditor.render.mockResolvedValueOnce(editorModel);

					return { loggedInClient };
				};

				it('should return OK status', async () => {
					const { loggedInClient } = setup();

					const response = await loggedInClient.get('de');

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});

			describe('when editor throws error', () => {
				const setup = () => {
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

					h5pEditor.render.mockRejectedValueOnce(new Error('Could not get H5P editor'));

					return { loggedInClient };
				};

				it('should return INTERNAL_SERVER_ERROR status', async () => {
					const { loggedInClient } = setup();

					const response = await loggedInClient.get('de');

					expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
				});
			});
		});
	});

	describe('get h5p editor', () => {
		describe('when user is not logged in', () => {
			it('should return UNAUTHORIZED status', async () => {
				const response = await testApiClient.get('123/de');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when editor is returned successfully', () => {
				const setup = async () => {
					const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();

					const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);

					const parentId = new ObjectId().toHexString();
					const h5pContent = h5pContentFactory.build({ parentId });

					await em.persist([h5pContent]).flush();
					em.clear();

					const { editorModel, exampleContent } = buildContent();
					h5pEditor.render.mockResolvedValueOnce({ editorModel, content: exampleContent });
					h5pEditor.getContent.mockResolvedValueOnce(exampleContent);

					return { loggedInClient, contentId: h5pContent.id };
				};

				it('should return 200 status', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.get(`${contentId}/de`);

					expect(response.status).toEqual(200);
				});
			});

			describe('when content is not existing', () => {
				const setup = () => {
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

					const { contentId } = buildContent();

					return { loggedInClient, contentId };
				};

				it('should return 200 status', async () => {
					const { contentId, loggedInClient } = setup();

					const response = await loggedInClient.get(`${contentId}/de`);

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
				});
			});

			describe('when id is not a mongo id', () => {
				const setup = () => {
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

					return { loggedInClient };
				};

				it('should return 200 status', async () => {
					const { loggedInClient } = setup();

					const response = await loggedInClient.get(`123/de`);

					expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});
});
