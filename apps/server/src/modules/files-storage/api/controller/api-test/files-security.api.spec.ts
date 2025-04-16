import { createMock } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import NodeClam from 'clamscan';
import type { Server } from 'node:net';
import { FileRecordParentType, StorageLocation } from '../../../domain';
import { FilesStorageTestModule } from '../../../files-storage-test.module';
import { FileRecordEntity } from '../../../repo';
import { fileRecordEntityFactory } from '../../../testing';
import { ScanResultParams } from '../../dto';

const baseRouteName = '/file-security';
const scanResult: ScanResultParams = { virus_detected: false };

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication<Server>;
	let em: EntityManager;
	let validId: string;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
		})

			.overrideProvider(NodeClam)
			.useValue(createMock<NodeClam>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		validId = new ObjectId().toHexString();
	});

	describe('with bad request data', () => {
		it('should return status 400 for invalid token', async () => {
			const fileRecord = fileRecordEntityFactory.build({
				storageLocation: StorageLocation.SCHOOL,
				storageLocationId: validId,
				parentId: validId,
				parentType: FileRecordParentType.School,
			});
			await em.persistAndFlush(fileRecord);
			em.clear();

			const response = await testApiClient.put(`/update-status/wrong-token`, scanResult);

			expect(response.status).toEqual(404);
		});
	});

	describe(`with valid request data`, () => {
		it('should return right type of data', async () => {
			const fileRecord = fileRecordEntityFactory.build({
				storageLocation: StorageLocation.SCHOOL,
				storageLocationId: validId,
				parentId: validId,
				parentType: FileRecordParentType.School,
			});
			const token = fileRecord.securityCheck.requestToken || '';
			await em.persistAndFlush(fileRecord);
			em.clear();

			const response = await testApiClient.put(`/update-status/${token}`, scanResult);
			const changedFileRecord = await em.findOneOrFail(FileRecordEntity, fileRecord.id);

			expect(changedFileRecord.securityCheck.status).toStrictEqual('verified');
			expect(response.status).toEqual(200);
		});
	});
});
