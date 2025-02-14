import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
// import { cleanupCollections } from '@testing/cleanup-collections';
import { CreateDeletionBatchBodyParams } from '../dto';
import { AdminApiServerTestModule } from '../../../../server/admin-api.server.app.module';
import { DomainName } from '../../../domain/types';
import { DeletionBatchItemResponse } from '../dto/response/deletion-batch-item.response';
import { DeletionBatchEntity } from '../../../repo/entity';

const baseRouteName = '/deletion-batches';

describe('createBatch', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	const API_KEY = 'someotherkey';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

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
				targetRefIds: [
					'0000d224816abba584714c9c',
					'599ec1688e4e364ec18ff46e',
					'5fa30c23b229544f2c696e5e',
					'5fa30c23b229544f2c696e5x',
				],
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

	/*
	describe('when creating a new deletion batch with invalid params', () => {
		describe('when creating a new deletion batch with invalid name', () => {
			const setup = () => {
				const createDeletionBatchBodyParams = {
					name: '',
					targetRefDomain: DomainName.USER,
					targetRefIds: ['0000d224816abba584714c9c'],
				};

				return { createDeletionBatchBodyParams };
			};

			it('should return status 400', async () => {
				const { createDeletionBatchBodyParams } = setup();
				const response = await testApiClient.post('', createDeletionBatchBodyParams);

				expect(response.status).toEqual(400);
			});
		});

		describe('when creating a new deletion batch with invalid targetRefDomain', () => {
			 const setup = () => {
				const createDeletionBatchBodyParams = {
					name: 'xxx',
					targetRefDomain: 'foo,
					targetRefIds: ['0000d224816abba584714c9c'],
				};

				return { createDeletionBatchBodyParams };
			};
			it('should return status 400', async () => {
							it('should return status 400', async () => {
				const { createDeletionBatchBodyParams } = setup();
				const response = await testApiClient.post('', createDeletionBatchBodyParams);

				expect(response.status).toEqual(400);
			});
		});

		describe('when creating a new deletion batch with invalid targetRefIds', () => {
			const setup = () => {
				const createDeletionBatchBodyParams = {
					name: 'xxx',
					targetRefDomain: 'user,
					targetRefIds: ['not-a-valid-id'],
				};

				return { createDeletionBatchBodyParams };
			};
			it('should return status 400', async () => {
				const { createDeletionBatchBodyParams } = setup();
				const response = await testApiClient.post('', createDeletionBatchBodyParams);

				expect(response.status).toEqual(400);
			});
			});
		});
	});
 	*/
});
