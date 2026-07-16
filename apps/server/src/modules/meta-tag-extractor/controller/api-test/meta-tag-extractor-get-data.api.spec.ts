import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.app.module';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { MetaTagExtractorService } from '../../service';

const URL = 'https://best-example.de/my-article';

const mockedResponse = {
	url: URL,
	title: 'The greatest Test-Page',
	description: 'with great description',
};

describe(`get meta tags (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(MetaTagExtractorService)
			.useValue({
				getMetaData: () => mockedResponse,
			})
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, '/meta-tag-extractor');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with valid user', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			await em.persist([teacherAccount, teacherUser]).flush();
			em.clear();

			const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).build(teacherAccount);

			return { loggedInClient };
		};

		it('should return status 201', async () => {
			const { loggedInClient } = await setup();

			const { status } = await loggedInClient.post(undefined, { url: URL });

			expect(status).toEqual(201);
		});

		it('should return the meta tags of the external page', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, { url: URL });

			expect(response?.body).toEqual(expect.objectContaining(mockedResponse));
		});
	});

	describe('with invalid user', () => {
		it('should return status 401', async () => {
			const { status } = await new TestApiClientBuilder(app, baseRouteName).build().post(undefined, { url: URL });

			expect(status).toEqual(401);
		});
	});
});
