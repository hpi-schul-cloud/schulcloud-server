import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MailService } from '@infra/mail';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account';
import { RoleName, RoleService } from '@modules/role';
import { RoomMembershipService } from '@modules/room-membership';
import { SchoolService } from '@modules/school';
import { SchoolPurpose } from '@modules/school/domain';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType } from '@shared/domain/interface';
import { RegistrationRepo } from '../../repo';
import { registrationFactory } from '../../testing/registration.factory';
import { Registration, RegistrationCreateProps, RegistrationProps } from '../do';
import { RegistrationService } from './registration.service';

describe('RegistrationService', () => {
	let module: TestingModule;
	let service: RegistrationService;
	let registrationRepo: DeepMocked<RegistrationRepo>;
	let roleService: DeepMocked<RoleService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;
	let schoolService: DeepMocked<SchoolService>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RegistrationService,
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: MailService,
					useValue: createMock<MailService>(),
				},
				{
					provide: RegistrationRepo,
					useValue: createMock<RegistrationRepo>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: RoomMembershipService,
					useValue: createMock<RoomMembershipService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		service = module.get<RegistrationService>(RegistrationService);
		registrationRepo = module.get(RegistrationRepo);
		roleService = module.get(RoleService);
		roomMembershipService = module.get(RoomMembershipService);
		userService = module.get(UserService);
		schoolService = module.get(SchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
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
		const setup = (registrationProps: Partial<RegistrationProps>) => {
			const registration = registrationFactory.build(registrationProps);
			registrationRepo.findBySecret.mockResolvedValue(registration);

			const externalPersonRole = { id: new ObjectId().toHexString(), name: RoleName.EXTERNALPERSON };
			roleService.findByName.mockResolvedValue(externalPersonRole);

			const externalPersonsSchool = schoolFactory.build({
				name: 'External Persons School',
				purpose: SchoolPurpose.EXTERNAL_PERSON_SCHOOL,
			});
			schoolService.getSchools.mockResolvedValue([externalPersonsSchool]);

			const savedUser = userDoFactory.buildWithId();
			userService.save.mockResolvedValue(savedUser);

			return { registration, savedUser };
		};

		it('should create user and account from registration', async () => {
			const registration = registrationFactory.build();
			registrationRepo.findBySecret.mockResolvedValue(registration);

			await service.completeRegistration(registration, LanguageType.EN, 'SecurePassword123!');

			expect(userService.save).toHaveBeenCalledWith(
				expect.objectContaining({
					email: registration.email,
					firstName: registration.firstName,
					lastName: registration.lastName,
				})
			);
		});

		describe('when external person role is missing', () => {
			it('should throw an error', async () => {
				const registration = registrationFactory.build();
				registrationRepo.findBySecret.mockResolvedValue(registration);

				const error = new BadRequestException('ExternalPerson role not found');
				roleService.findByName.mockRejectedValue(error);

				await expect(service.completeRegistration(registration, LanguageType.EN, 'SecurePassword123!')).rejects.toThrow(
					BadRequestException
				);
			});
		});

		describe('when external-persons-school is missing', () => {
			it('should throw an error', async () => {
				const registration = registrationFactory.build();
				registrationRepo.findBySecret.mockResolvedValue(registration);
				const externalPersonRole = { id: new ObjectId().toHexString(), name: RoleName.EXTERNALPERSON };
				roleService.findByName.mockResolvedValue(externalPersonRole);
				schoolService.getSchools.mockResolvedValue([]);

				await expect(service.completeRegistration(registration, LanguageType.EN, 'SecurePassword123!')).rejects.toThrow(
					InternalServerErrorException
				);
			});
		});

		describe('when user has no id after saving', () => {
			it('should throw an error', async () => {
				const { registration, savedUser } = setup({});
				delete savedUser.id;
				userService.save.mockResolvedValue(savedUser);

				await expect(service.completeRegistration(registration, LanguageType.EN, 'SecurePassword123!')).rejects.toThrow(
					InternalServerErrorException
				);
			});
		});

		describe('when firstname is missing', () => {
			it('should throw an error', async () => {
				const registration = registrationFactory.build({ firstName: undefined });
				registrationRepo.findBySecret.mockResolvedValue(registration);

				await expect(service.completeRegistration(registration, LanguageType.EN, 'SecurePassword123!')).rejects.toThrow(
					BadRequestException
				);
			});
		});

		describe('when lastname is missing', () => {
			it('should throw an error', async () => {
				const registration = registrationFactory.build({ lastName: undefined });
				registrationRepo.findBySecret.mockResolvedValue(registration);

				await expect(service.completeRegistration(registration, LanguageType.EN, 'SecurePassword123!')).rejects.toThrow(
					BadRequestException
				);
			});
		});

		describe('when adding the user to rooms', () => {
			describe('whon no roomId is defined', () => {
				it('should not attempt to add user to any room', async () => {
					const { registration } = setup({ roomIds: [] });

					await service.completeRegistration(registration, LanguageType.EN, 'SecurePassword123!');

					expect(roomMembershipService.addMembersToRoom).not.toHaveBeenCalled();
				});
			});

			describe('when one roomId is defined', () => {
				it('should add user to the room', async () => {
					const { registration, savedUser } = setup({ roomIds: [new ObjectId().toHexString()] });

					await service.completeRegistration(registration, LanguageType.EN, 'SecurePassword123!');

					expect(roomMembershipService.addMembersToRoom).toHaveBeenCalledWith(registration.roomIds[0], [savedUser.id]);
				});
			});

			describe('when multiple roomIds are defined', () => {
				it('should add user to all rooms', async () => {
					const roomId1 = new ObjectId().toHexString();
					const roomId2 = new ObjectId().toHexString();
					const { registration, savedUser } = setup({ roomIds: [roomId1, roomId2] });

					await service.completeRegistration(registration, LanguageType.EN, 'SecurePassword123!');

					expect(roomMembershipService.addMembersToRoom).toHaveBeenCalledWith(roomId1, [savedUser.id]);
					expect(roomMembershipService.addMembersToRoom).toHaveBeenCalledWith(roomId2, [savedUser.id]);
				});
			});
		});
	});
});
