import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';

import { storageProviderFactory } from '@shared/domain/factory';
import { Platform } from '@mikro-orm/core';
import { StorageProviderRepo } from '.';
import { EncryptedStringType } from '../../../shared/repo/types/EncryptedString.type';

describe('StorageProviderRepo', () => {
	let repo: StorageProviderRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [StorageProviderRepo],
		}).compile();

		repo = module.get(StorageProviderRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	it('should encrypt property secretAccessKey in persistence', async () => {
		const secretAccessKey = 'toBeEncrypted';
		const encryptedStringType = new EncryptedStringType();

		const storageProvider = storageProviderFactory.build({ secretAccessKey });
		await repo.persistAndFlush(storageProvider);

		// fetch plain json from db
		const { id } = storageProvider;
		const driver = em.getDriver();
		const result = await driver.findOne('StorageProvider', { _id: id });

		// secretAccessKey should be encrypted in persistence
		const decryptedSecretAccessKey = encryptedStringType.convertToJSValue(
			result?.secretAccessKey,
			undefined as unknown as Platform
		);
		expect(decryptedSecretAccessKey).toEqual(secretAccessKey);

		em.clear();

		// load via repo should decrypt the type
		const storageProviderFromPersistence = await repo.findOneById(id);
		expect(storageProviderFromPersistence.secretAccessKey).toEqual(secretAccessKey);
	});
});
