import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/repo';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { DeletionRequestEntity } from '../../../repo/entity';
import { deletionRequestEntityFactory } from '../../../repo/entity/testing';

const baseRouteName = '/deletionRequests';

describe(`deletionRequest delete (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	const API_KEY = 'someotherkey';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('cancelDeletionRequest', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
			const deletionRequest = deletionRequestEntityFactory.build({
				targetRefId: studentUser.id,
			});

			await em.persist([deletionRequest, studentUser, studentAccount]).flush();
			em.clear();

			return { deletionRequest };
		};

		it('should return status 204', async () => {
			const { deletionRequest } = await setup();

			const response = await new TestApiClientBuilder(app, baseRouteName).withApiKey(API_KEY).build().delete(`${deletionRequest.id}`);

			expect(response.status).toEqual(204);
		});

		it('should actually delete deletionRequest', async () => {
			const { deletionRequest } = await setup();

			await new TestApiClientBuilder(app, baseRouteName).withApiKey(API_KEY).build().delete(`${deletionRequest.id}`);

			await expect(em.findOneOrFail(DeletionRequestEntity, deletionRequest.id)).rejects.toThrow();
		});

		it('should reactivate account if targetRefDomain is USER', async () => {
			const { deletionRequest } = await setup();

			await new TestApiClientBuilder(app, baseRouteName).withApiKey(API_KEY).build().delete(`${deletionRequest.id}`);

			const account = await em.findOne(AccountEntity, { userId: new ObjectId(deletionRequest.targetRefId) });
			expect(account?.deactivatedAt).toBeUndefined();
		});
	});
});
