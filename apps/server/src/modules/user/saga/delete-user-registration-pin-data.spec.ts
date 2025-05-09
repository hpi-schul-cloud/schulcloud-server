import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { registrationPinEntityFactory } from '@modules/registration-pin/entity/testing';
import { DeleteUserRegistrationPinDataStep } from './delete-user-registration-pin-data';
import { RegistrationPinService } from '@modules/registration-pin';
import { UserService } from '../domain';

describe(DeleteUserRegistrationPinDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserRegistrationPinDataStep;
	let userService: DeepMocked<UserService>;
	let registrationPinService: DeepMocked<RegistrationPinService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeleteUserRegistrationPinDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: RegistrationPinService,
					useValue: createMock<RegistrationPinService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserRegistrationPinDataStep);
		userService = module.get(UserService);
		registrationPinService = module.get(RegistrationPinService);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserRegistrationPinDataStep(
				sagaService,
				userService,
				registrationPinService,
				createMock<Logger>()
			);
			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.USER_REGISTRATIONPIN, step);
		});
	});

	describe('execute', () => {
		describe('when there is no registrationPin', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();

				userService.findByIdOrNull.mockResolvedValue(user);
				registrationPinService.findByEmail.mockResolvedValue([]);
				userService.getParentEmailsFromUser.mockResolvedValue([]);
				registrationPinService.deleteByEmail.mockResolvedValue(0);

				const expectedResult = StepReportBuilder.build(ModuleName.USER_REGISTRATIONPIN, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, 0, []),
				]);

				return {
					expectedResult,
					user,
				};
			};

			it('should return domainOperation object with proper values', async () => {
				const { expectedResult, user } = setup();

				const result = await step.execute({ userId: user.id! });

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when deleting existing registrationPin', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();

				const registrationPin = registrationPinEntityFactory.buildWithId({ email: user.email });

				registrationPinService.findByEmail.mockResolvedValueOnce([registrationPin]);
				registrationPinService.deleteByEmail.mockResolvedValueOnce(1);

				const expectedResult = StepReportBuilder.build(ModuleName.USER_REGISTRATIONPIN, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [registrationPin.id]),
				]);

				return {
					expectedResult,
					user,
				};
			};

			it('should return report with proper values', async () => {
				const { expectedResult, user } = setup();

				const result = await step.execute({ userId: user.id! });

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('findRegistrationEmails', () => {
		const setup = () => {
			const user = userDoFactory.buildWithId({ email: 'john@doe.foo' });
			const parentEmails = ['papa@doe.foo', 'mama@doe.foo'];

			userService.findByIdOrNull.mockResolvedValueOnce(user);
			userService.getParentEmailsFromUser.mockResolvedValueOnce(parentEmails);

			return {
				user,
				parentEmails,
			};
		};

		it('should return user email and parent emails', async () => {
			const { user, parentEmails } = setup();

			const result = await step.findRegistrationEmails(user.id!);

			expect(result).toEqual([user.email, ...parentEmails]);
		});
	});

	describe('findAllRegistrationPinIdsByEmails', () => {
		const setup = () => {
			const registrationPins = [registrationPinEntityFactory.buildWithId()];
			const registrationPinIds = registrationPins.map((item) => item.id);

			registrationPinService.findByEmail.mockResolvedValueOnce(registrationPins);

			return {
				registrationPins,
				registrationPinIds,
			};
		};

		it('should call registrationPinService.findByEmail', async () => {
			setup();

			await step.findAllRegistrationPinIdsByEmails(['john@doe.foo']);

			expect(registrationPinService.findByEmail).toHaveBeenCalledWith('john@doe.foo');
		});

		it('should return all registrationPin ids', async () => {
			const { registrationPinIds } = setup();

			const result = await step.findAllRegistrationPinIdsByEmails(['john@doe.foo']);

			expect(result).toEqual(registrationPinIds);
		});
	});

	describe('deleteAllRegistrationPinsByEmails', () => {
		const setup = () => {
			registrationPinService.deleteByEmail.mockResolvedValue(1);
		};

		it('should call registrationPinService.deleteByEmail', async () => {
			setup();

			await step.deleteAllRegistrationPinsByEmails(['john@doe.foo']);

			expect(registrationPinService.deleteByEmail).toHaveBeenCalledWith('john@doe.foo');
		});

		it('should return total deleted count', async () => {
			setup();

			const result = await step.deleteAllRegistrationPinsByEmails(['john@doe.foo', 'papa@doe.foo']);

			expect(result).toEqual(2);
		});
	});
});
