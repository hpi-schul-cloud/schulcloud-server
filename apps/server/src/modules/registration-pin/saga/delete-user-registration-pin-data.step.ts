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
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RegistrationPinRepo } from '../repo';
import { RegistrationPinEntity } from '../entity';

@Injectable()
export class DeleteUserRegistrationPinDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.REGISTRATIONPIN;

	constructor(
		private readonly sagaService: SagaService,
		private readonly registrationPinRepo: RegistrationPinRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserRegistrationPinDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const registrationPinsDeleted = await this.deleteRegistrationPins(userId);

		const result = StepReportBuilder.build(this.moduleName, [registrationPinsDeleted]);

		return result;
	}

	public async deleteRegistrationPins(email: string): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting user data from RegistrationPin',
				this.moduleName,
				email,
				StepStatus.PENDING
			)
		);
		const [registrationPinToDelete, count] = await this.registrationPinRepo.findAllByEmail(email);
		const numberOfDeletedRegistrationPins = await this.registrationPinRepo.deleteRegistrationPinByEmail(email);

		if (numberOfDeletedRegistrationPins !== count) {
			throw new Error(`Failed to delete user data from RegistrationPin for '${email}'`);
		}

		const result = StepOperationReportBuilder.build(
			StepOperationType.DELETE,
			numberOfDeletedRegistrationPins,
			this.getRegistrationPinsId(registrationPinToDelete)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted user data from RegistrationPin',
				this.moduleName,
				email,
				StepStatus.FINISHED,
				0,
				numberOfDeletedRegistrationPins
			)
		);

		return result;
	}

	private getRegistrationPinsId(registrationPins: RegistrationPinEntity[]): EntityId[] {
		return registrationPins.map((registrationPin) => registrationPin.id);
	}
}
