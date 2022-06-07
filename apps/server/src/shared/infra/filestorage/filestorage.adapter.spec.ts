import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { directoryFactory, fileFactory } from '@shared/testing';
import { AwsClientStub, mockClient } from 'aws-sdk-client-mock';
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

		it('should fail for directories', async () => {
			const file = directoryFactory.build();

			await expect(adapter.deleteFile(file)).rejects.toThrow();
		});
	});
});
