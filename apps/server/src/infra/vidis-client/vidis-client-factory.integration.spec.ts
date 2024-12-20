import { createMock } from '@golevelup/ts-jest';
import { ServerTestModule } from '@modules/server';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VidisClientFactory } from './vidis-client-factory';
import { VidisClientModule } from './vidis-client.module';

describe.skip('VidisClientFactory Integration', () => {
	let module: TestingModule;
	let sut: VidisClientFactory;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ServerTestModule, VidisClientModule],
		})
			.overrideProvider(ConfigService)
			.useValue(
				createMock<ConfigService>({
					getOrThrow: (key: string) => {
						switch (key) {
							case 'VIDIS_API_CLIENT_BASE_URL':
								return 'https://test2.schulportal-thueringen.de/tip-ms/api';

							default:
								throw new Error(`Unknown key: ${key}`);
						}
					},
				})
			)
			.compile();

		sut = module.get(VidisClientFactory);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});
});
