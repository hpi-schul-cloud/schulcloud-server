import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from '../../user/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from '../auth.service';
import { jwtOptionsProvider } from '../jwt-options.provider';

describe('AuthController', () => {
	let controller: AuthController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [UsersModule, PassportModule],
			controllers: [AuthController],
			providers: [AuthService, JwtService, jwtOptionsProvider],
		}).compile();

		controller = module.get<AuthController>(AuthController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
