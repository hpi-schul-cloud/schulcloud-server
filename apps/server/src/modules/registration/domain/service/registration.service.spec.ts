import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationRepo } from '../../repo';
import { registrationFactory } from '../../testing/registration.factory';
import { RegistrationCreateProps } from '../do';
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
		it('should call repo to save registration', async () => {
			const props: RegistrationCreateProps = {
				email: 'test@example.com',
				firstName: 'John',
				lastName: 'Doe',
				roomId: new ObjectId().toHexString(),
			};

			await service.createRegistration(props);

			expect(registrationRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					email: props.email,
					firstName: props.firstName,
					lastName: props.lastName,
					roomIds: [props.roomId],
				})
			);
		});

		it('should throw for blocked email domain', async () => {
			const props: RegistrationCreateProps = {
				email: 'test@10mail.org',
				firstName: 'John',
				lastName: 'Doe',
				roomId: new ObjectId().toHexString(),
			};

			await expect(service.createRegistration(props)).rejects.toThrow(BadRequestException);

			expect(registrationRepo.save).not.toHaveBeenCalled();
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

			await service.getSingleRegistrationByHash(hash);

			expect(registrationRepo.findByHash).toHaveBeenCalledWith(hash);
		});

		it('should return registration', async () => {
			const registration = registrationFactory.build();
			registrationRepo.findByHash.mockResolvedValue(registration);

			const result = await service.getSingleRegistrationByHash('someRandomHash');

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

	describe('generateRegistrationMail', () => {
		beforeEach(() => {
			jest.spyOn(Configuration, 'get').mockImplementation((config: string) => {
				if (config === 'SMTP_SENDER') {
					return 'example@sender.com';
				}
				if (config === 'HOST') {
					return 'https://example.com';
				}
				return null;
			});
		});

		it('should generate registration mail with correct structure', () => {
			const email = 'test@example.com';
			const firstName = 'John';
			const lastName = 'Doe';
			const hash = 'someHash';

			const result = service.generateRegistrationMail(email, firstName, lastName, hash);

			expect(Configuration.get).toHaveBeenCalledWith('SMTP_SENDER');
			expect(Configuration.get).toHaveBeenCalledWith('HOST');

			expect(result).toEqual(
				expect.objectContaining({
					recipients: [email],
					from: 'example@sender.com',
				})
			);
		});
	});
});
