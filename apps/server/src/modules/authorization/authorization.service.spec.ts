import { Test, TestingModule } from '@nestjs/testing';
import { FeathersModule } from '../feathers/feathers.module';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers-auth.provider';

describe('AuthorizationService', () => {
	let service: AuthorizationService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FeathersModule],
			providers: [AuthorizationService, FeathersAuthProvider],
		}).compile();

		service = module.get<AuthorizationService>(AuthorizationService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
