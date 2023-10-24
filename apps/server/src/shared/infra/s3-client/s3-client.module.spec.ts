import { createMock } from '@golevelup/ts-jest';
import { Inject } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '@src/core/logger';
import { S3ClientAdapter } from './s3-client.adapter';
import { S3ClientModule } from './s3-client.module';

const connectionOne = 'connectionOne';
const connectionTwo = 'connectionTwo';

class OneService {
	constructor(@Inject(connectionOne) public s3client: S3ClientAdapter) {}
}

describe('S3ClientModule', () => {
	let module: TestingModule;
	const s3ClientConfigOne = {
		connectionName: connectionOne,
		endpoint: 'endpoint-1',
		region: 'region-eu-2',
		bucket: 'bucket-1',
		accessKeyId: 'accessKeyId-1',
		secretAccessKey: 'secretAccessKey-1',
	};
	const s3ClientConfigTwo = {
		connectionName: connectionTwo,
		endpoint: 'endpoint-2',
		region: 'region-eu-2',
		bucket: 'bucket-2',
		accessKeyId: 'accessKeyId-2',
		secretAccessKey: 'secretAccessKey-2',
	};

	let s3ClientAdapterOne: S3ClientAdapter;
	let s3ClientAdapterTwo: S3ClientAdapter;
	let serviceOne: OneService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				S3ClientModule.register([s3ClientConfigOne, s3ClientConfigTwo]),
				ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
			],
			providers: [
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				OneService,
			],
		}).compile();

		s3ClientAdapterOne = module.get(connectionOne);
		s3ClientAdapterTwo = module.get(connectionTwo);
		serviceOne = module.get(OneService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when connectionOne is initialized with register method', () => {
		it('should be defined', () => {
			expect(s3ClientAdapterOne).toBeDefined();
		});

		it('should has correctly connection', () => {
			expect(s3ClientAdapterOne.config).toBe(s3ClientConfigOne);
		});
	});

	describe('when connectionTwo is initialized with register method', () => {
		it('should be defined', () => {
			expect(s3ClientAdapterTwo).toBeDefined();
		});

		it('should has correctly connection', () => {
			expect(s3ClientAdapterTwo.config).toBe(s3ClientConfigTwo);
		});
	});

	describe('OneService', () => {
		describe('when connectionOne is injected', () => {
			it('should has injected s3ClientAdapterOne', () => {
				expect(serviceOne.s3client).toBe(s3ClientAdapterOne);
			});
		});
	});
});
