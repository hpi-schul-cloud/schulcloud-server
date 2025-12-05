import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MailService } from '@infra/mail';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account';
import { RoleService } from '@modules/role';
import { SchoolService } from '@modules/school/domain/service/school.service';
import { UserService } from '@modules/user';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType } from '@shared/domain/interface';
import { RegistrationRepo } from '../../repo';
import { registrationFactory } from '../../testing/registration.factory';
import { Registration, RegistrationCreateProps } from '../do';
import { RegistrationService } from './registration.service';

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
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: MailService,
					useValue: createMock<MailService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},

				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
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

	describe('createOrUpdateRegistration', () => {
		const setup = (options?: { existingRegistration?: Registration }) => {
			registrationRepo.findByEmail.mockResolvedValue(options?.existingRegistration ?? null);
		};

		describe('when registration does exist', () => {
			it('should call repo to update registration', async () => {
				const existingRegistration = registrationFactory.build();
				setup({ existingRegistration });
				const props: RegistrationCreateProps = {
					email: existingRegistration.email,
					firstName: 'Jane',
					lastName: 'Smith',
					roomId: new ObjectId().toHexString(),
				};

				const expectedParameterToSave = registrationFactory.build({
					...existingRegistration.getProps(),
					firstName: props.firstName,
					lastName: props.lastName,
					roomIds: [...existingRegistration.roomIds, props.roomId],
				});

				await service.createOrUpdateRegistration(props);

				expect(registrationRepo.save).toHaveBeenCalledWith(expectedParameterToSave);
			});
		});

		describe('when registration does not exist', () => {
			it('should call repo to save registration', async () => {
				setup();
				const props: RegistrationCreateProps = {
					email: 'test@example.com',
					firstName: 'John',
					lastName: 'Doe',
					roomId: new ObjectId().toHexString(),
				};

				await service.createOrUpdateRegistration(props);

				expect(registrationRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						email: props.email,
						firstName: props.firstName,
						lastName: props.lastName,
						roomIds: [props.roomId],
					})
				);
			});

			describe('when email domain is forbidden', () => {
				it('should throw an error', async () => {
					const props: RegistrationCreateProps = {
						email: 'test@10mail.org',
						firstName: 'John',
						lastName: 'Doe',
						roomId: new ObjectId().toHexString(),
					};

					await expect(service.createOrUpdateRegistration(props)).rejects.toThrow(BadRequestException);

					expect(registrationRepo.save).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe('saveRegistration', () => {
		it('should call repo to save registration', async () => {
			const registration = registrationFactory.build();

			await service.saveRegistration(registration);

			expect(registrationRepo.save).toHaveBeenCalledWith(registration);
		});
	});

	describe('getSingleRegistrationByEmail', () => {
		it('should call repo to get registration by its email', async () => {
			const email = 'test@example.com';

			await service.getSingleRegistrationByEmail(email);

			expect(registrationRepo.findByEmail).toHaveBeenCalledWith(email);
		});

		it('should return registration', async () => {
			const registration = registrationFactory.build();
			registrationRepo.findByEmail.mockResolvedValue(registration);

			const result = await service.getSingleRegistrationByEmail('test@example.com');

			expect(result).toBe(registration);
		});
	});

	describe('getSingleRegistrationByHash', () => {
		it('should call repo to get registration by hash', async () => {
			const hash = 'someRandomHash';

			await service.getSingleRegistrationBySecret(hash);

			expect(registrationRepo.findBySecret).toHaveBeenCalledWith(hash);
		});

		it('should return registration', async () => {
			const registration = registrationFactory.build();
			registrationRepo.findBySecret.mockResolvedValue(registration);

			const result = await service.getSingleRegistrationBySecret('someRandomHash');

			expect(result).toBe(registration);
		});
	});

	describe('getRegistrationsByRoomId', () => {
		it('should call repo to get registrations by room id', async () => {
			const roomId = 'someRandomRoomId';

			await service.getRegistrationsByRoomId(roomId);

			expect(registrationRepo.findByRoomId).toHaveBeenCalledWith(roomId);
		});

		it('should return registration', async () => {
			const registrations = registrationFactory.buildList(2);
			registrationRepo.findByRoomId.mockResolvedValue(registrations);

			const result = await service.getRegistrationsByRoomId('someRandomRoomId');

			expect(result).toBe(registrations);
		});
	});

	describe('completeRegistration', () => {
		it('should create user and account from registration', async () => {
			const registration = registrationFactory.build();
			const language = LanguageType.EN;
			const password = 'SecurePassword123!';
			registrationRepo.findBySecret.mockResolvedValue(registration);
			const createUserSpy = jest.spyOn(service as any, 'createUser').mockResolvedValue(null);

			await service.completeRegistration(registration, language, password);

			expect(createUserSpy).toHaveBeenCalledWith(registration, language);
		});
	});
});
