import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { mockClient, AwsClientStub } from 'aws-sdk-client-mock';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';

import { fileFactory, storageProviderFactory } from '@shared/domain/factory';
import { Platform } from '@mikro-orm/core';
import { FileStorageRepo } from '.';
import { EncryptedStringType } from '../../../shared/repo/types/EncryptedString.type';

describe('FileStorageRepo', () => {
	let repo: FileStorageRepo;
	let em: EntityManager;
	let module: TestingModule;
	let s3Mock: AwsClientStub<S3Client>;
	let configBefore: IConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [FileStorageRepo],
		}).compile();

		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('S3_KEY', 'abcdefghijklmnop');

		repo = module.get(FileStorageRepo);
		em = module.get(EntityManager);
	});

	beforeEach(() => {
		s3Mock = mockClient(S3Client);
	});

	afterAll(async () => {
		await module.close();
		s3Mock.restore();
		Configuration.reset(configBefore);
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	describe('deleteFile', () => {
		it('should send deletion command to storage provider client', async () => {
			const bucket = 'bucket';
			const storageFileName = 'storageFileName';

			const file = fileFactory.build({ bucket, storageFileName });

			await repo.deleteFile(file);

			expect(s3Mock.send.callCount).toEqual(1);

			const callArgs = s3Mock.send.firstCall.args;
			expect(callArgs.length).toEqual(1);

			const callArg = callArgs[0] as DeleteObjectCommand;
			expect(callArg.input.Bucket).toEqual(bucket);
			expect(callArg.input.Key).toEqual(storageFileName);
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
});
