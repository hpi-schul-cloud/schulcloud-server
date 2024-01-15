import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userDoFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { RegistrationPinService } from '.';
import { RegistrationPinRepo } from '../repo';

describe(RegistrationPinService.name, () => {
	let module: TestingModule;
	let service: RegistrationPinService;
	let registrationPinRepo: DeepMocked<RegistrationPinRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RegistrationPinService,
				{
					provide: RegistrationPinRepo,
					useValue: createMock<RegistrationPinRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(RegistrationPinService);
		registrationPinRepo = module.get(RegistrationPinRepo);

		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('deleteRegistrationPinByEmail', () => {
		describe('when deleting registrationPin', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();

				registrationPinRepo.deleteRegistrationPinByEmail.mockResolvedValueOnce(1);

				return {
					user,
				};
			};

			it('should call registrationPinRep', async () => {
				const { user } = setup();

				await service.deleteRegistrationPinByEmail(user.email);

				expect(registrationPinRepo.deleteRegistrationPinByEmail).toBeCalledWith(user.email);
			});

			it('should delete registrationPin by email', async () => {
				const { user } = setup();

				const result: number = await service.deleteRegistrationPinByEmail(user.email);

				expect(result).toEqual(1);
			});
		});
	});
});
