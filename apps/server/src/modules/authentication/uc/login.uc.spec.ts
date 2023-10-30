import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from '../services/authentication.service';
import { LoginDto } from './dto';
import { LoginUc } from './login.uc';

describe('LoginUc', () => {
	let module: TestingModule;
	let loginUc: LoginUc;

	let authenticationService: DeepMocked<AuthenticationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
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
				const userInfo = {
					accountId: '',
					roles: [],
					schoolId: '',
					userId: '',
					systemId: '',
					impersonated: false,
					someProperty: 'shouldNotBeMapped',
				};
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

				expect(authenticationService.generateJwt).toHaveBeenCalledWith({
					accountId: userInfo.accountId,
					userId: userInfo.userId,
					schoolId: userInfo.schoolId,
					roles: userInfo.roles,
					systemId: userInfo.systemId,
					support: userInfo.impersonated,
				});
			});

			it('should return a loginDto', async () => {
				const { userInfo, loginDto } = setup();

				const result: LoginDto = await loginUc.getLoginData(userInfo);

				expect(result).toEqual<LoginDto>({
					accessToken: loginDto.accessToken,
				});
			});
		});
	});
});
