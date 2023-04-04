import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LoginUc } from './login.uc';
import { AuthenticationService } from '../services/authentication.service';
import { CreateJwtPayload } from '../interface/jwt-payload';
import { LoginDto } from './dto/login.dto';

describe('LoginUc', () => {
	let module: TestingModule;
	let loginUc: LoginUc;
	let authenticationService: DeepMocked<AuthenticationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				LoginUc,
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
			],
		}).compile();
		loginUc = await module.get(LoginUc);
		authenticationService = await module.get(AuthenticationService);
	});

	describe('getLoginData', () => {
		describe('when userInfo is given', () => {
			const setup = () => {
				const userInfo: CreateJwtPayload = { accountId: '', roles: [], schoolId: '', userId: '' };
				const loginDto: LoginDto = new LoginDto({ accessToken: 'accessToken' });
				authenticationService.generateJwt.mockResolvedValue(loginDto);

				return {
					userInfo,
					loginDto,
				};
			};

			it('should call the authService', async () => {
				const { userInfo } = setup();

				await loginUc.getLoginData(userInfo);

				expect(authenticationService.generateJwt).toHaveBeenCalledWith(userInfo);
			});

			it('should return a loginDto', async () => {
				const { userInfo, loginDto } = setup();

				const result: LoginDto = await loginUc.getLoginData(userInfo);

				expect(result).toEqual(
					expect.objectContaining<LoginDto>({
						accessToken: loginDto.accessToken,
					})
				);
			});
		});
	});
});
