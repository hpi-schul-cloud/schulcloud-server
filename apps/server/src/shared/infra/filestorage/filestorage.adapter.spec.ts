import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { mockClient, AwsClientStub } from 'aws-sdk-client-mock';

import { fileFactory } from '@shared/domain/factory';
import { FileStorageAdapter } from '.';

describe('FileStorageAdapter', () => {
	let adapter: FileStorageAdapter;
	let module: TestingModule;
	let s3Mock: AwsClientStub<S3Client>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [FileStorageAdapter],
		}).compile();

		adapter = module.get(FileStorageAdapter);
	});

	beforeEach(() => {
		s3Mock = mockClient(S3Client);
	});

	afterAll(async () => {
		await module.close();
		s3Mock.restore();
	});

	describe('deleteFile', () => {
		it('should send deletion command to storage provider client', async () => {
			const bucket = 'bucket';
			const storageFileName = 'storageFileName';

			const file = fileFactory.build({ bucket, storageFileName });

			await adapter.deleteFile(file);

			expect(s3Mock.send.callCount).toEqual(1);

			const callArgs = s3Mock.send.firstCall.args;
			expect(callArgs.length).toEqual(1);

			const callArg = callArgs[0] as DeleteObjectCommand;
			expect(callArg.input.Bucket).toEqual(bucket);
			expect(callArg.input.Key).toEqual(storageFileName);
		});
	});
});
