import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationRepo } from '../../repo';
import { RegistrationCreateProps } from '../do';
import { RegistrationService } from './registration.service';
import { LanguageType } from '@shared/domain/interface';
import { registrationFactory } from '@modules/registration/testing';

describe('RegistrationService', () => {
	let module: TestingModule;
	let service: RegistrationService;
	let registrationRepo: DeepMocked<RegistrationRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RegistrationService,
				{
					provide: RegistrationRepo,
					useValue: createMock<RegistrationRepo>(),
				},
			],
		}).compile();

		service = module.get<RegistrationService>(RegistrationService);
		registrationRepo = module.get(RegistrationRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('createRegistration', () => {
		const setup = () => {
			const props: RegistrationCreateProps = {
				email: 'test@example.com',
				firstName: 'John',
				lastName: 'Doe',
				consent: [],
				language: LanguageType.DE,
				roomIds: [],
			};
			return { props };
		};

		it('should call repo to save registration', async () => {
			const { props } = setup();

			await service.createRegistration(props);

			expect(registrationRepo.save).toHaveBeenCalledWith(expect.objectContaining(props));
		});
	});

	describe('getSingleRegistrationByHash', () => {
		const setup = () => {
			const registration = registrationFactory.buildList(2)[0];
			registrationRepo.findByHash.mockResolvedValue(registration);

			return { registration };
		};

		it('should call repo to get registration by hash', async () => {
			const hash = 'someRandomHashForNow';

			await service.getSingleRegistrationByHash(hash);

			expect(registrationRepo.findByHash).toHaveBeenCalledWith(hash);
		});

		it('should return registration', async () => {
			const { registration } = setup();

			const result = await service.getSingleRegistrationByHash('someRandomHashForNow');

			expect(result).toBe(registration);
		});
	});
});
