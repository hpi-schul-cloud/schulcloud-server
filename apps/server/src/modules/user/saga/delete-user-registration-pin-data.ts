import { Logger } from '@core/logger';
import { RegistrationPinService } from '@modules/registration-pin';
import {
	ModuleName,
	SagaService,
	SagaStep,
	StepOperationReport,
	StepOperationReportBuilder,
	StepOperationType,
	StepReport,
	StepReportBuilder,
	StepStatus,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class DeleteUserRegistrationPinDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.USER_REGISTRATIONPIN;

	constructor(
		private readonly sagaService: SagaService,
		private readonly userService: UserService,
		private readonly registrationPinService: RegistrationPinService,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserRegistrationPinDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const registrationPinsDeleted = await this.deleteUserRegistrationPins(userId);

		const result = StepReportBuilder.build(this.moduleName, [registrationPinsDeleted]);

		return result;
	}

	public async deleteUserRegistrationPins(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting user data from RegistrationPin',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);

		const registrationEmails = await this.findRegistrationEmails(userId);
		const allRegistrationPinIds = await this.findAllRegistrationPinIdsByEmails(registrationEmails);
		const totalDeletedCount = await this.deleteAllRegistrationPinsByEmails(registrationEmails);

		const result = StepOperationReportBuilder.build(StepOperationType.DELETE, totalDeletedCount, allRegistrationPinIds);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted user data from RegistrationPin',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				0,
				totalDeletedCount
			)
		);

		return result;
	}

	public async findRegistrationEmails(userId: EntityId): Promise<string[]> {
		const user = await this.userService.findByIdOrNull(userId);

		const parentEmails = await this.userService.getParentEmailsFromUser(userId);

		const registrationEmails: string[] = [];
		if (user && user.email) {
			registrationEmails.push(user.email, ...parentEmails);
		}

		return registrationEmails;
	}

	public async findAllRegistrationPinIdsByEmails(registrationEmails: string[]): Promise<EntityId[]> {
		const results = await Promise.all(
			registrationEmails.map(async (email) => {
				const registrationPins = await this.registrationPinService.findByEmail(email);
				return registrationPins;
			})
		);

		const allRegistrationPins = results.flatMap((registrationPins) => registrationPins);
		const allRegistrationPinIds = allRegistrationPins.map((item) => item.id);

		return allRegistrationPinIds;
	}

	public async deleteAllRegistrationPinsByEmails(registrationEmails: string[]): Promise<number> {
		const results = await Promise.all(
			registrationEmails.map(async (email) => {
				const numDeleted = await this.registrationPinService.deleteByEmail(email);
				return numDeleted;
			})
		);
		const totalDeletedCount = results.reduce((sum, count) => sum + count, 0);

		return totalDeletedCount;
	}
}
