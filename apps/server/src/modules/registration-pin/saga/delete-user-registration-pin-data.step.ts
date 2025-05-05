import { Logger } from '@core/logger';
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
import { RegistrationPinEntity } from '../entity';
import { RegistrationPinRepo } from '../repo';

@Injectable()
export class DeleteUserRegistrationPinDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.REGISTRATIONPIN;

	constructor(
		private readonly sagaService: SagaService,
		private readonly userService: UserService,
		private readonly registrationPinRepo: RegistrationPinRepo,
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
		const [allRegistrationPins, totalCount] = await this.findRegistrationPinsByEmails(registrationEmails);

		const totalDeleted = await Promise.all(
			registrationEmails.map((email) => this.registrationPinRepo.deleteRegistrationPinByEmail(email))
		);
		const totalDeletedCount = totalDeleted.reduce((sum, count) => sum + count, 0);

		if (totalDeletedCount !== totalCount) {
			throw new Error(`Failed to delete all user data from RegistrationPin`);
		}

		const result = StepOperationReportBuilder.build(
			StepOperationType.DELETE,
			totalDeletedCount,
			this.getRegistrationPinsId(allRegistrationPins)
		);

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

	public async findRegistrationPinsByEmails(registrationEmails: string[]): Promise<[RegistrationPinEntity[], number]> {
		const results = await Promise.all(
			registrationEmails.map(async (email) => {
				const [registrationPins, count] = await this.registrationPinRepo.findAllByEmail(email);
				return { email, registrationPins, count };
			})
		);

		const registrationPins = results.flatMap((result) => result.registrationPins);
		const count = results.reduce((sum, result) => sum + result.count, 0);

		return [registrationPins, count];
	}

	public async findRegistrationEmails(userId: EntityId): Promise<string[]> {
		const user = await this.userService.findByIdOrNull(userId);
		const parentEmails = await this.userService.getParentEmailsFromUser(userId);

		const registrationEmails: string[] = [];
		if (user && user.email) {
			registrationEmails.concat([user.email, ...parentEmails]);
		}

		return registrationEmails;
	}

	private getRegistrationPinsId(registrationPins: RegistrationPinEntity[]): EntityId[] {
		return registrationPins.map((registrationPin) => registrationPin.id);
	}
}
