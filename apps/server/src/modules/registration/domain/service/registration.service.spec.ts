import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationRepo } from '../../repo';
import { RegistrationCreateProps, RegistrationUpdateProps } from '../do';
import { RegistrationService } from './registration.service';
import { LanguageType } from '@shared/domain/interface';
import { registrationFactory } from '../../testing/registration.factory';
import { Consent } from '../type';

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

	describe('updateRegistration', () => {
		const setup = () => {
			const props: RegistrationCreateProps = {
				email: 'test@example.com',
				firstName: 'John',
				lastName: 'Doe',
				consent: [],
				language: LanguageType.DE,
				roomIds: [],
			};
			const registration = registrationFactory.build(props);
			registrationRepo.findById.mockResolvedValue(registration);

			const updatedProps: RegistrationUpdateProps = {
				consent: [Consent.TERMS_OF_USE],
				language: LanguageType.EN,
				password: 'new password',
				roomIds: ['room-id'],
			};

			return { registration, props, updatedProps };
		};

		it('should call repo to save registration', async () => {
			const { registration, updatedProps } = setup();

			const updatedRegistration = await service.updateRegistration(registration, updatedProps);

			expect(registrationRepo.save).toHaveBeenCalledWith(updatedRegistration);
		});
	});

	describe('saveRegistration', () => {
		const setup = () => {
			const registration = registrationFactory.build();
			return { registration };
		};

		it('should call repo to save registration', async () => {
			const { registration } = setup();

			await service.saveRegistration(registration);

			expect(registrationRepo.save).toHaveBeenCalledWith(registration);
		});
	});

	describe('getSingleRegistrationByEmail', () => {
		const setup = () => {
			const registration = registrationFactory.build();
			registrationRepo.findByEmail.mockResolvedValue(registration);

			return { registration };
		};

		it('should call repo to get registration by its email', async () => {
			const email = 'test@example.com';

			await service.getSingleRegistrationByEmail(email);

			expect(registrationRepo.findByEmail).toHaveBeenCalledWith(email);
		});

		it('should return registration', async () => {
			const { registration } = setup();

			const result = await service.getSingleRegistrationByEmail('email');

			expect(result).toBe(registration);
		});
	});

	describe('getSingleRegistrationByRegistrationId', () => {
		const setup = () => {
			const registration = registrationFactory.build();
			registrationRepo.findById.mockResolvedValue(registration);

			return { registration };
		};

		it('should call repo to get registration by its id', async () => {
			const registrationId = 'someRandomRegistrationIdForNow';

			await service.getSingleRegistrationByRegistrationId(registrationId);

			expect(registrationRepo.findById).toHaveBeenCalledWith(registrationId);
		});

		it('should return registration', async () => {
			const { registration } = setup();

			const result = await service.getSingleRegistrationByRegistrationId('someRandomRegistrationIdForNow');

			expect(result).toBe(registration);
		});
	});

	describe('getSingleRegistrationByHash', () => {
		const setup = () => {
			const registration = registrationFactory.build();
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

	describe('getRegistrationsByRoomId', () => {
		const setup = () => {
			const registrations = registrationFactory.buildList(2);
			registrationRepo.findByRoomId.mockResolvedValue(registrations);

			return { registrations };
		};

		it('should call repo to get registrations by room id', async () => {
			const roomId = 'someRandomRoomId';

			await service.getRegistrationsByRoomId(roomId);

			expect(registrationRepo.findByRoomId).toHaveBeenCalledWith(roomId);
		});

		it('should return registration', async () => {
			const { registrations } = setup();

			const result = await service.getRegistrationsByRoomId('someRandomRoomId');

			expect(result).toBe(registrations);
		});
	});
});
