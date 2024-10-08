import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtTestFactory } from '@shared/testing';
import { AuthenticationService } from '../services';
import { LogoutUc } from './logout.uc';

describe(LogoutUc.name, () => {
	let module: TestingModule;
	let logoutUc: LogoutUc;

	let authenticationService: DeepMocked<AuthenticationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LogoutUc,
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
			],
		}).compile();

		logoutUc = await module.get(LogoutUc);
		authenticationService = await module.get(AuthenticationService);
	});

	describe('logout', () => {
		describe('when a jwt is given', () => {
			const setup = () => {
				const jwt = JwtTestFactory.createJwt();

				return {
					jwt,
				};
			};

			it('should remove the user from the whitelist', async () => {
				const { jwt } = setup();

				await logoutUc.logout(jwt);

				expect(authenticationService.removeJwtFromWhitelist).toHaveBeenCalledWith(jwt);
			});
		});
	});
});
