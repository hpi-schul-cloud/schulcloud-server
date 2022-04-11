import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { storageProviderFactory } from '@shared/testing';
import { Platform } from '@mikro-orm/core';
import { EncryptedStringType } from '@shared/repo/types/EncryptedString.type';
import { StorageProvider } from '@shared/domain';
import { StorageProviderRepo } from '.';

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

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(StorageProvider);
		});
	});

	it('should encrypt property secretAccessKey in persistence', async () => {
		const secretAccessKey = 'toBeEncrypted';
		const encryptedStringType = new EncryptedStringType();

		const storageProvider = storageProviderFactory.build({ secretAccessKey });
		await repo.save(storageProvider);

		// fetch plain json from db
		const { id } = storageProvider;
		const driver = em.getDriver();
		const result = (await driver.findOne('StorageProvider', { _id: id })) as unknown as StorageProvider;

		// secretAccessKey should be encrypted in persistence
		expect(result.secretAccessKey).not.toEqual(secretAccessKey);
		const decryptedSecretAccessKey = encryptedStringType.convertToJSValue(
			result.secretAccessKey,
			undefined as unknown as Platform
		);
		expect(decryptedSecretAccessKey).toEqual(secretAccessKey);

		em.clear();

		// load via repo should decrypt the type transparently
		const storageProviderFromPersistence = await repo.findById(id);
		expect(storageProviderFromPersistence.secretAccessKey).toEqual(secretAccessKey);
	});
});
