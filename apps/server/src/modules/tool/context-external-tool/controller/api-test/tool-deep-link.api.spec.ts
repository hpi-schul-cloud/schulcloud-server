import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory } from '@testing/factory/course.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import crypto from 'crypto-js';
import { externalToolEntityFactory, lti11ToolConfigEntityFactory } from '../../../external-tool/testing';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { ContextExternalToolEntity, ContextExternalToolType, LtiDeepLinkEmbeddable } from '../../entity';
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

	const basePath = '/tools/context-external-tools';
	const decryptedSecret = 'secret';
	const encryptedSecret = crypto.AES.encrypt(decryptedSecret, Configuration.get('AES_KEY') as string).toString();

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		orm = app.get(MikroORM);
		testApiClient = new TestApiClient(app, basePath);
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
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const ltiDeepLinkToken = ltiDeepLinkTokenEntityFactory.build({ user: teacherUser });
				const course = courseFactory.buildWithId({
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

				const publicBackendUrl = Configuration.get('PUBLIC_BACKEND_URL') as string;
				const callbackUrl = `${publicBackendUrl}/v3${basePath}/${contextExternalTool.id}/lti11-deep-link-callback`;
				const requestFactory = new Lti11DeepLinkParamsFactory(callbackUrl, lti11Config.key, decryptedSecret);
				const postParams = requestFactory.buildRaw({
					data: ltiDeepLinkToken.state,
				});

				await em.persistAndFlush([
					teacherAccount,
					teacherUser,
					ltiDeepLinkToken,
					course,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				]);
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
