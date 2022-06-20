import { Test, TestingModule } from '@nestjs/testing';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud.strategy';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('NextCloud Adapter Strategy', () => {
	let module: TestingModule;
	let strategy: NextcloudStrategy;
	let httpService: DeepMocked<HttpService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				NextcloudStrategy,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();
		strategy = module.get(NextcloudStrategy);
		httpService = module.get(HttpService);
	});

	describe('Update TeamPermissions For Role', () => {
		it('should ');
	});
});
