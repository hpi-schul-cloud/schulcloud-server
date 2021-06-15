import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { FeathersServiceProvider } from './feathers-service.provider';

describe('AuthorizationService', () => {
	let service: AuthorizationService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationService, FeathersServiceProvider],
		}).compile();

		service = module.get<AuthorizationService>(AuthorizationService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
