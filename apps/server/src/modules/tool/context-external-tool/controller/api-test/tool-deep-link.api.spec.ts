import { EntityManager, MikroORM } from '@mikro-orm/core';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server';
import { TOOL_ENCRYPTION_CONFIG_TOKEN, ToolEncryptionConfig } from '@modules/tool/encryption.config';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AesEncryptionHelper } from '@shared/common/utils';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { externalToolEntityFactory, lti11ToolConfigEntityFactory } from '../../../external-tool/testing';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../../tool-config';
import { ContextExternalToolEntity, ContextExternalToolType, LtiDeepLinkEmbeddable } from '../../repo';
import {
	contextExternalToolEntityFactory,
	Lti11DeepLinkParamsFactory,
	ltiDeepLinkTokenEntityFactory,
} from '../../testing';
import { Lti11DeepLinkContentItemParams } from '../dto';

describe('ToolDeepLinkController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;
	let testApiClient: TestApiClient;
	let encryptionConfig: ToolEncryptionConfig;
	let config: ToolConfig;

	const basePath = '/tools/context-external-tools';

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		orm = app.get(MikroORM);
		testApiClient = new TestApiClient(app, basePath);

		encryptionConfig = app.get<ToolEncryptionConfig>(TOOL_ENCRYPTION_CONFIG_TOKEN);
		config = app.get<ToolConfig>(TOOL_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await orm.getSchemaGenerator().clearDatabase();
	});

	describe('[POST] tools/context-external-tools/:contextExternalToolId/lti11-deep-link-callback', () => {
		describe('when the lti deep linking callback is successfully', () => {
			const setup = async () => {
				const encryptionKey = encryptionConfig.aesKey;
				const decryptedSecret = 'secret';
				const encryptedSecret = AesEncryptionHelper.encrypt(decryptedSecret, encryptionKey);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const ltiDeepLinkToken = ltiDeepLinkTokenEntityFactory.build({ user: teacherUser });
				const course = courseEntityFactory.buildWithId({
					teachers: [teacherUser],
				});

				const lti11Config = lti11ToolConfigEntityFactory.build({
					secret: encryptedSecret,
				});
				const externalTool = externalToolEntityFactory.buildWithId({ config: lti11Config });
				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					tool: externalTool,
					school: teacherUser.school,
				});
				const contextExternalTool = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
				});

				const { publicBackendUrl } = config;
				const callbackUrl = `${publicBackendUrl}/v3${basePath}/${contextExternalTool.id}/lti11-deep-link-callback`;
				const requestFactory = new Lti11DeepLinkParamsFactory(callbackUrl, lti11Config.key, decryptedSecret);
				const postParams = requestFactory.buildRaw({
					data: ltiDeepLinkToken.state,
				});

				await em
					.persist([
						teacherAccount,
						teacherUser,
						ltiDeepLinkToken,
						course,
						externalTool,
						schoolExternalTool,
						contextExternalTool,
					])
					.flush();
				em.clear();

				const targetContent = requestFactory.build({
					data: ltiDeepLinkToken.state,
				}).content_items?.['@graph'][0] as Lti11DeepLinkContentItemParams;

				return {
					postParams,
					contextExternalTool,
					targetContent,
				};
			};

			it('should create a lti deep link with the context external tool', async () => {
				const { postParams, contextExternalTool, targetContent } = await setup();

				const response = await testApiClient
					.post(`/${contextExternalTool.id}/lti11-deep-link-callback`)
					.send(postParams);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.text).toEqual(
					'<!DOCTYPE html><head><title>Window can be closed</title><script>window.close();</script></head><body><span>This window can be closed</span></body>'
				);
				const dbContextExternalTool = await em.findOneOrFail(ContextExternalToolEntity, contextExternalTool.id);
				expect(dbContextExternalTool.ltiDeepLink).toMatchObject<LtiDeepLinkEmbeddable>({
					mediaType: targetContent.mediaType,
					title: targetContent.title,
					url: targetContent.url,
					text: targetContent.text,
					parameters: [
						{
							name: 'dl_param',
							value: targetContent.custom?.dl_param,
						},
					],
					availableFrom: targetContent.available?.startDatetime,
					availableUntil: targetContent.available?.endDatetime,
					submissionFrom: targetContent.submission?.startDatetime,
					submissionUntil: targetContent.submission?.endDatetime,
				});
			});
		});
	});
});
