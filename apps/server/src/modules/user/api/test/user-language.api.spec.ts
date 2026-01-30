import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error';
import { LanguageType } from '@shared/domain/interface';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { User } from '../../repo';

const baseRouteName = '/user/language';

describe(baseRouteName, () => {
	let app: INestApplication;
	let em: EntityManager;
	let apiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);

		apiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when user is not logged in', () => {
		it('should return status 401', async () => {
			const response = await apiClient.patch(undefined, LanguageType.DE);

			expect(response.status).toEqual(401);
		});
	});

	describe('with bad request data', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			await em.persist([teacherAccount, teacherUser]).flush();
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);

			return { loggedInClient };
		};

		it('should throw an validation error is not supported language is passed.', async () => {
			const { loggedInClient } = await setup();

			const result = await loggedInClient.patch(undefined, 'super');
			const response = result.body as ApiValidationError;

			expect(response.validationErrors).toEqual([
				{
					errors: ['language must be one of the following values: de, en, es, uk'],
					field: ['language'],
				},
			]);
		});
	});

	describe('with valid request data', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ language: LanguageType.DE });

			await em.persist([teacherAccount, teacherUser]).flush();
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);

			return { loggedInClient, teacherUser };
		};

		it('should return status 200 for successful request.', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.patch(undefined, { language: LanguageType.EN });

			expect(response.status).toEqual(200);
		});

		it('should return successful true.', async () => {
			const { loggedInClient } = await setup();

			const result = await loggedInClient.patch(undefined, { language: LanguageType.EN });
			const response = result.body as { successful: boolean };

			expect(response).toEqual({ successful: true });
		});

		it('should change the language', async () => {
			const { loggedInClient, teacherUser } = await setup();

			await loggedInClient.patch(undefined, { language: LanguageType.EN });

			const user = await em.findOne(User, { id: teacherUser.id });

			expect(user?.language).toEqual('en');
		});

		it('should support de, en, es, ua', async () => {
			const { loggedInClient } = await setup();

			const de = await loggedInClient.patch(undefined, { language: LanguageType.DE });
			const en = await loggedInClient.patch(undefined, { language: LanguageType.EN });
			const es = await loggedInClient.patch(undefined, { language: LanguageType.ES });
			const ua = await loggedInClient.patch(undefined, { language: LanguageType.UK });

			expect(de.status).toEqual(200);
			expect(en.status).toEqual(200);
			expect(es.status).toEqual(200);
			expect(ua.status).toEqual(200);
		});
	});
});
