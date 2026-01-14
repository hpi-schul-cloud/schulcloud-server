import { INTERNAL_ENCRYPTION_CONFIG_TOKEN } from '@infra/encryption';
import { EntityManager } from '@mikro-orm/core';
import { adminApiServerConfig } from '@modules/server/admin-api-server.config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { AdminApiServerTestModule } from '../../../../server/admin-api.server.app.module';
import { DomainName } from '../../../domain/types';
import { DeletionBatchEntity } from '../../../repo/entity';
import { CreateDeletionBatchBodyParams } from '../dto';
import { DeletionBatchItemResponse } from '../dto/response/deletion-batch-item.response';

const baseRouteName = '/deletion-batches';
const encryptionKey = 'test-key-with-32-characters-long';

describe('createBatch', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	const API_KEY = 'someotherkey';

	beforeAll(async () => {
		const config = adminApiServerConfig();
		config.ADMIN_API__ALLOWED_API_KEYS = [API_KEY];

		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		})
			.overrideProvider(INTERNAL_ENCRYPTION_CONFIG_TOKEN)
			.useValue({ aesKey: encryptionKey })
			.compile();

		app = module.createNestApplication();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);

		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when creating a new deletion batch', () => {
		const setup = () => {
			const createDeletionBatchBodyParams: CreateDeletionBatchBodyParams = {
				name: 'test',
				targetRefDomain: DomainName.USER,
				targetRefIds: ['0000d224816abba584714c9c', '599ec1688e4e364ec18ff46e', '5fa30c23b229544f2c696e5e'],
			};

			return { createDeletionBatchBodyParams };
		};

		it('should return status 201', async () => {
			const { createDeletionBatchBodyParams } = setup();

			const response = await testApiClient.post('', createDeletionBatchBodyParams);

			expect(response.status).toEqual(201);
		});

		it('should return the created deletion batch', async () => {
			const { createDeletionBatchBodyParams } = setup();

			const response = await testApiClient.post('', createDeletionBatchBodyParams);

			const result = response.body as DeletionBatchItemResponse;
			expect(result.id).toBeDefined();
		});

		it('should acttually create the deletion batch', async () => {
			const { createDeletionBatchBodyParams } = setup();

			const response = await testApiClient.post('', createDeletionBatchBodyParams);

			const result = response.body as DeletionBatchItemResponse;

			const dbResult = await em.findOne(DeletionBatchEntity, { id: result.id });
			expect(dbResult).toBeDefined();
		});
	});
});
