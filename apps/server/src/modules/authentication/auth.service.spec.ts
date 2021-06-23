import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from '../user/users.module';
import { AuthService } from './auth.service';
import { jwtOptionsProvider } from './jwt-options.provider';
import { LocalStrategy } from './strategy/local.strategy';

describe('AuthService', () => {
	let service: AuthService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [UsersModule, PassportModule],
			providers: [AuthService, LocalStrategy, JwtService, jwtOptionsProvider],
		}).compile();

		service = module.get<AuthService>(AuthService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
