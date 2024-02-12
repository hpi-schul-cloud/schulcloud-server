import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userDoFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { DomainName, OperationType } from '@shared/domain/types';
import { DeletionErrorLoggableException } from '@shared/common/loggable-exception';
import { RegistrationPinRepo } from '../repo';
import { RegistrationPinService } from '.';
import { registrationPinEntityFactory } from '../entity/testing';

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
		describe('when there is no registrationPin', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();

				registrationPinRepo.findAllByEmail.mockResolvedValueOnce([[], 0]);
				registrationPinRepo.deleteRegistrationPinByEmail.mockResolvedValueOnce(0);

				const expectedResult = DomainOperationBuilder.build(DomainName.REGISTRATIONPIN, OperationType.DELETE, 0, []);

				return {
					expectedResult,
					user,
				};
			};

			it('should return domainOperation object with proper values', async () => {
				const { expectedResult, user } = setup();

				const result = await service.deleteRegistrationPinByEmail(user.email);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when deleting existing registrationPin', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const registrationPin = registrationPinEntityFactory.buildWithId({ email: user.email });

				registrationPinRepo.findAllByEmail.mockResolvedValueOnce([[registrationPin], 1]);
				registrationPinRepo.deleteRegistrationPinByEmail.mockResolvedValueOnce(1);

				const expectedResult = DomainOperationBuilder.build(DomainName.REGISTRATIONPIN, OperationType.DELETE, 1, [
					registrationPin.id,
				]);

				return {
					expectedResult,
					user,
				};
			};

			it('should call registrationPinRep', async () => {
				const { user } = setup();

				await service.deleteRegistrationPinByEmail(user.email);

				expect(registrationPinRepo.deleteRegistrationPinByEmail).toBeCalledWith(user.email);
			});

			it('should delete registrationPin by email and return domainOperation object with proper information', async () => {
				const { expectedResult, user } = setup();

				const result = await service.deleteRegistrationPinByEmail(user.email);

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

				await expect(service.deleteRegistrationPinByEmail(user.email)).rejects.toThrowError(expectedError);
			});
		});
	});
});
