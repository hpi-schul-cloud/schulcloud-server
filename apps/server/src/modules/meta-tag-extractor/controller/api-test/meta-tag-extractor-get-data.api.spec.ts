import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
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
	let testApiClient: TestApiClient;

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

			await em.persistAndFlush([teacherAccount, teacherUser]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

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
			const { status } = await testApiClient.post(undefined, { url: URL });

			expect(status).toEqual(401);
		});
	});
});
