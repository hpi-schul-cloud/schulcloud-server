import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { externalToolEntityFactory, lti11ToolConfigEntityFactory } from '../../../external-tool/testing';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { ContextExternalToolType } from '../../entity';
import {
	contextExternalToolEntityFactory,
	Lti11DeepLinkParamsFactory,
	ltiDeepLinkTokenEntityFactory,
} from '../../testing';

describe('ToolDeepLinkController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;
	let testApiClient: TestApiClient;

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

				const lti11Config = lti11ToolConfigEntityFactory.build();
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
				const lti11DeepLinkParams = new Lti11DeepLinkParamsFactory(
					callbackUrl,
					lti11Config.key,
					lti11Config.secret
				).build({
					data: ltiDeepLinkToken.state,
				});
				const postParams = {
					...lti11DeepLinkParams,
					content_items: JSON.stringify(lti11DeepLinkParams.content_items),
				};

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

				return {
					postParams,
					contextExternalTool,
				};
			};

			it('should create a lti deep link with the context external tool', async () => {
				const { postParams, contextExternalTool } = await setup();

				const response = await testApiClient
					.post(`/${contextExternalTool.id}/lti11-deep-link-callback`)
					.send(postParams);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.text).toEqual(
					'<!DOCTYPE html><head><title>Window can be closed</title><script>window.close();</script></head><body><span>This window can be closed</span></body>'
				);
			});
		});
	});
});
