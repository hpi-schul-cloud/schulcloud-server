import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { mockClient, AwsClientStub } from 'aws-sdk-client-mock';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';

import { File, StorageProvider } from '@shared/domain';
import { FilesRepo, FileStorageRepo } from '.';

describe('FileStorageRepo', () => {
	let repo: FilesRepo;
	let em: EntityManager;
	let module: TestingModule;
	let s3Mock: AwsClientStub<S3Client>;
	let configBefore: IConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [File, StorageProvider],
				}),
			],
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

			const storageProvider = new StorageProvider({
				endpointUrl: 'http://localhost',
				accessKeyId: 'accessKeyId',
				secretAccessKey: 'secret',
			});

			const file = new File({
				bucket,
				storageFileName,
				storageProvider,
			});

			await repo.deleteFile(file);

			expect(s3Mock.send.callCount).toEqual(1);

			const callArgs = s3Mock.send.firstCall.args;
			expect(callArgs.length).toEqual(1);

			const callArg = callArgs[0] as DeleteObjectCommand;
			expect(callArg.input.Bucket).toEqual(bucket);
			expect(callArg.input.Key).toEqual(storageFileName);
		});
	});
});
