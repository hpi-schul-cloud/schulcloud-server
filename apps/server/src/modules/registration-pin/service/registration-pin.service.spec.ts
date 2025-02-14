import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	DeletionErrorLoggableException,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { Test, TestingModule } from '@nestjs/testing';
import { userDoFactory } from '@testing/factory/user.do.factory';
import { RegistrationPinService } from '.';
import { registrationPinEntityFactory } from '../entity/testing';
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
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('deleteRegistrationPinByEmail', () => {
		describe('when there is no registrationPin', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();

				registrationPinRepo.findAllByEmail.mockResolvedValueOnce([[], 0]);
				registrationPinRepo.deleteRegistrationPinByEmail.mockResolvedValueOnce(0);

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
					DomainOperationReportBuilder.build(OperationType.DELETE, 0, []),
				]);

				return {
					expectedResult,
					user,
				};
			};

			it('should return domainOperation object with proper values', async () => {
				const { expectedResult, user } = setup();

				const result = await service.deleteUserData(user.email);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when deleting existing registrationPin', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const registrationPin = registrationPinEntityFactory.buildWithId({ email: user.email });

				registrationPinRepo.findAllByEmail.mockResolvedValueOnce([[registrationPin], 1]);
				registrationPinRepo.deleteRegistrationPinByEmail.mockResolvedValueOnce(1);

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
					DomainOperationReportBuilder.build(OperationType.DELETE, 1, [registrationPin.id]),
				]);

				return {
					expectedResult,
					user,
				};
			};

			it('should call registrationPinRep', async () => {
				const { user } = setup();

				await service.deleteUserData(user.email);

				expect(registrationPinRepo.deleteRegistrationPinByEmail).toBeCalledWith(user.email);
			});

			it('should delete registrationPin by email and return domainOperation object with proper information', async () => {
				const { expectedResult, user } = setup();

				const result = await service.deleteUserData(user.email);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when registrationPin exists and failed to delete it', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const registrationPin = registrationPinEntityFactory.buildWithId({ email: user.email });

				registrationPinRepo.findAllByEmail.mockResolvedValueOnce([[registrationPin], 1]);
				registrationPinRepo.deleteRegistrationPinByEmail.mockResolvedValueOnce(0);

				const expectedError = new DeletionErrorLoggableException(
					`Failed to delete user data from RegistrationPin for '${user.email}'`
				);

				return {
					expectedError,
					user,
				};
			};

			it('should throw an error', async () => {
				const { expectedError, user } = setup();

				await expect(service.deleteUserData(user.email)).rejects.toThrowError(expectedError);
			});
		});

		describe('findByEmail', () => {
			describe('when finding registration pins by email', () => {
				const setup = () => {
					const registrationPin = registrationPinEntityFactory.buildWithId();

					registrationPinRepo.findAllByEmail.mockResolvedValueOnce([[registrationPin], 1]);

					return { registrationPin };
				};

				it('should return found registration pins', async () => {
					const { registrationPin } = setup();

					registrationPinRepo.findAllByEmail.mockResolvedValueOnce([[registrationPin], 1]);

					const result = await service.findByEmail(registrationPin.email);

					expect(result).toEqual([registrationPin]);
				});
			});
		});
	});
});
