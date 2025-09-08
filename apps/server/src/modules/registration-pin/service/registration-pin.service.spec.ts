import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationPinService } from '.';
import { registrationPinEntityFactory } from '../entity/testing';
import { RegistrationPinRepo } from '../repo';

describe('RegistrationPinService', () => {
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
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByEmail', () => {
		const setup = () => {
			const registrationPin = registrationPinEntityFactory.buildWithId();

			registrationPinRepo.findAllByEmail.mockResolvedValueOnce([[registrationPin], 1]);

			return { registrationPin };
		};

		it('should return found registration pins', async () => {
			const { registrationPin } = setup();

			const result = await service.findByEmail(registrationPin.email);

			expect(result).toEqual([registrationPin]);
		});
	});

	describe('deleteByEmail', () => {
		const setup = () => {
			const registrationPin = registrationPinEntityFactory.buildWithId();

			registrationPinRepo.deleteRegistrationPinByEmail.mockResolvedValueOnce(1);

			return { registrationPin };
		};

		it('should call registrationPinRepo.deleteRegistrationPinByEmail ', async () => {
			const { registrationPin } = setup();
			await service.deleteByEmail(registrationPin.email);
			expect(registrationPinRepo.deleteRegistrationPinByEmail).toHaveBeenCalledWith(registrationPin.email);
		});

		it('should return the number of deleted registration pins', async () => {
			const { registrationPin } = setup();
			const numDeleted = await service.deleteByEmail(registrationPin.email);

			expect(numDeleted).toEqual(1);
		});
	});
});
