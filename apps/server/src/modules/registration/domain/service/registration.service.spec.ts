import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MailService } from '@infra/mail';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account';
import { REGISTRATION_CONFIG_TOKEN } from '@modules/registration/registration.config';
import { RoleName, RoleService } from '@modules/role';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { roomFactory } from '@modules/room/testing';
import { SchoolService } from '@modules/school';
import { SchoolPurpose } from '@modules/school/domain';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType } from '@shared/domain/interface';
import { RegistrationRepo } from '../../repo';
import { registrationFactory } from '../../testing/registration.factory';
import { Registration, RegistrationCreateProps, RegistrationProps } from '../do';
import { ResendingRegistrationMailLoggable } from '../error/resend-registration-mail.loggable';
import { RegistrationService } from './registration.service';

describe('RegistrationService', () => {
	let module: TestingModule;
	let service: RegistrationService;
	let registrationRepo: DeepMocked<RegistrationRepo>;
	let roleService: DeepMocked<RoleService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;
	let schoolService: DeepMocked<SchoolService>;
	let userService: DeepMocked<UserService>;
	let mailService: DeepMocked<MailService>;
	let logger: DeepMocked<Logger>;
	let accountService: DeepMocked<AccountService>;
	let roomService: DeepMocked<RoomService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RegistrationService,
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
				{
					provide: REGISTRATION_CONFIG_TOKEN,
					useValue: {
						featureExternalPersonRegistrationEnabled: true,
						fromEmailAddress: 'no-reply@example.com',
						scTitle: 'dBildungscloud',
						hostUrl: 'https://example.com',
					},
				},
			],
		}).compile();

		service = module.get<RegistrationService>(RegistrationService);
		registrationRepo = module.get(RegistrationRepo);
		roleService = module.get(RoleService);
		roomMembershipService = module.get(RoomMembershipService);
		userService = module.get(UserService);
		schoolService = module.get(SchoolService);
		mailService = module.get(MailService);
		logger = module.get(Logger);
		accountService = module.get(AccountService);
		roomService = module.get(RoomService);
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
						resentAt: undefined,
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

	describe('resendRegistrationMails', () => {
		describe('when registration mail was not resent within last two minutes', () => {
			it('should call repo to save registration with new resentAt date', async () => {
				const now = new Date();
				jest.useFakeTimers().setSystemTime(now);

				const registration = registrationFactory.build();
				registrationRepo.findById.mockResolvedValueOnce(registration);
				const expectedRegistration = registrationFactory.build({ ...registration.getProps(), resentAt: now });

				await service.resendRegistrationMails([registration.id]);

				expect(registrationRepo.save).toHaveBeenCalledWith(expectedRegistration);
			});

			it('should call mail service to resend registration mail', async () => {
				const room = roomFactory.build({ name: 'A test room' });
				const registrationData = {
					firstName: 'John',
					lastName: 'Doe',
					roomIds: [room.id],
				};
				const registrationWithoutResentAt = registrationFactory.build({
					...registrationData,
					email: 'registrationWithoutResentAt@example.com',
					resentAt: undefined,
				});
				const registrationWithResentAt = registrationFactory.build({
					...registrationData,
					email: 'registrationWithResentAt@example.com',
					resentAt: new Date(Date.now() - 5 * 60 * 1000),
				});
				const registrationWithUnelapsedCooldown = registrationFactory.build({
					...registrationData,
					email: 'registrationWithUnelapsedCooldown@example.com',
					resentAt: new Date(Date.now() - 60 * 1000),
				});

				registrationRepo.findById
					.mockResolvedValueOnce(registrationWithoutResentAt)
					.mockResolvedValueOnce(registrationWithResentAt)
					.mockResolvedValueOnce(registrationWithUnelapsedCooldown);
				roomService.getSingleRoom.mockResolvedValue(room);

				await service.resendRegistrationMails([
					registrationWithoutResentAt.id,
					registrationWithResentAt.id,
					registrationWithUnelapsedCooldown.id,
				]);

				expect(mailService.send).toHaveBeenCalledTimes(2);
				expect(mailService.send).toHaveBeenNthCalledWith(
					1,
					expect.objectContaining({
						recipients: [registrationWithoutResentAt.email],
					})
				);
				expect(mailService.send).toHaveBeenNthCalledWith(
					2,
					expect.objectContaining({
						recipients: [registrationWithResentAt.email],
					})
				);
				expect(mailService.send).not.toHaveBeenNthCalledWith(
					3,
					expect.objectContaining({
						recipients: [registrationWithUnelapsedCooldown.email],
					})
				);
			});
		});

		describe('when registration mail was resent within last two minutes', () => {
			it('should not call repo to save registration', async () => {
				const recentDate = new Date();
				jest.useFakeTimers().setSystemTime(recentDate);

				const oneMinuteAgo = new Date(recentDate.getTime() - 1 * 60 * 1000);
				const registration = registrationFactory.build({ resentAt: oneMinuteAgo });
				registrationRepo.findById.mockResolvedValueOnce(registration);

				await service.resendRegistrationMails([registration.id]);

				expect(registrationRepo.save).not.toHaveBeenCalled();
			});

			it('should not call mail service to resend registration mail', async () => {
				const recentDate = new Date();
				jest.useFakeTimers().setSystemTime(recentDate);

				const oneMinuteAgo = new Date(recentDate.getTime() - 1 * 60 * 1000);
				const registration = registrationFactory.build({ resentAt: oneMinuteAgo });
				registrationRepo.findById.mockResolvedValueOnce(registration);

				await service.resendRegistrationMails([registration.id]);

				expect(mailService.send).not.toHaveBeenCalled();
			});
		});

		describe('when an error occurs during resending', () => {
			it('should log with failed registration id', async () => {
				const registration = registrationFactory.build();
				registrationRepo.findById.mockRejectedValueOnce(new Error('Database error'));

				await service.resendRegistrationMails([registration.id]);

				expect(logger.warning).toHaveBeenCalledWith(new ResendingRegistrationMailLoggable(registration.id));
			});
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

			userService.save.mockImplementation((user) => {
				user.id = new ObjectId().toHexString();
				return Promise.resolve(user);
			});

			await service.completeRegistration(registration, LanguageType.EN, 'SecurePassword123!');

			expect(userService.save).toHaveBeenCalledWith(
				expect.objectContaining({
					email: registration.email,
					firstName: registration.firstName,
					lastName: registration.lastName,
				})
			);

			expect(accountService.saveWithValidation).toHaveBeenCalledWith(
				expect.objectContaining({
					username: registration.email,
					password: 'SecurePassword123!',
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

	describe('cancelRegistrationsForRoom', () => {
		describe('when registration exists', () => {
			it('should remove roomId from registration', async () => {
				const roomIdToRemove = new ObjectId().toHexString();
				const registration = registrationFactory.build({ roomIds: [roomIdToRemove, new ObjectId().toHexString()] });
				registrationRepo.findById.mockResolvedValue(registration);

				const updatedRegistrations = await service.cancelRegistrationsForRoom([registration.id], roomIdToRemove);

				expect(updatedRegistrations?.[0].roomIds).not.toContain(roomIdToRemove);
				expect(registrationRepo.save).toHaveBeenCalledWith(updatedRegistrations?.[0]);
			});
		});

		describe('when registration does not exist', () => {
			it('should throw an error', async () => {
				registrationRepo.findById.mockRejectedValueOnce(new NotFoundException());

				await expect(
					service.cancelRegistrationsForRoom(['nonExistingRegistrationId'], new ObjectId().toHexString())
				).rejects.toThrow(NotFoundException);
			});
		});

		describe('when removing the roomId results in no roomIds left', () => {
			it('should delete the registration and return null', async () => {
				const roomIdToRemove = new ObjectId().toHexString();
				const registration = registrationFactory.build({ roomIds: [roomIdToRemove] });
				registrationRepo.findById.mockResolvedValue(registration);

				const result = await service.cancelRegistrationsForRoom([registration.id], roomIdToRemove);

				expect(registrationRepo.deleteByIds).toHaveBeenCalledWith([registration.id]);
				expect(result).toBeNull();
			});
		});

		describe('when multiple registrationIds are provided', () => {
			it('should process all registrationIds and return updated registrations', async () => {
				const roomIdToRemove = new ObjectId().toHexString();

				const registrationWithRoomRemaining = registrationFactory.build({
					roomIds: [roomIdToRemove, new ObjectId().toHexString()],
				});
				const registrationToBeDeleted = registrationFactory.build({
					roomIds: [roomIdToRemove],
				});

				registrationRepo.findById
					.mockResolvedValueOnce(registrationWithRoomRemaining)
					.mockResolvedValueOnce(registrationToBeDeleted);

				const updatedRegistrations = await service.cancelRegistrationsForRoom(
					[registrationWithRoomRemaining.id, registrationToBeDeleted.id],
					roomIdToRemove
				);

				expect(updatedRegistrations).toHaveLength(1);
				expect(updatedRegistrations?.[0].id).toBe(registrationWithRoomRemaining.id);
				expect(updatedRegistrations?.[0].roomIds).not.toContain(roomIdToRemove);

				expect(registrationRepo.save).toHaveBeenCalledTimes(1);
				expect(registrationRepo.save).toHaveBeenCalledWith(updatedRegistrations?.[0]);
				expect(registrationRepo.deleteByIds).toHaveBeenCalledWith([registrationToBeDeleted.id]);
			});
		});
	});
});
