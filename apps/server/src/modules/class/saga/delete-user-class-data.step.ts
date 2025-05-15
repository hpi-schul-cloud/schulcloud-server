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
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Class } from '../domain';
import { ClassesRepo } from '../repo';

@Injectable()
export class DeleteUserClassDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.CLASS;

	constructor(
		private readonly sagaService: SagaService,
		private readonly classesRepo: ClassesRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserClassDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const classesModified = await this.removeUserFromClasses(userId);

		const result = StepReportBuilder.build(this.moduleName, [classesModified]);

		return result;
	}

	public async removeUserFromClasses(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable('Removing user from classes', this.moduleName, userId, StepStatus.PENDING)
		);

		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const classes = await this.classesRepo.findAllByUserId(userId);
		const numberOfUpdatedClasses = await this.classesRepo.removeUserReference(userId);

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			numberOfUpdatedClasses,
			this.getClassesId(classes)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully removed user from classes',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				numberOfUpdatedClasses,
				0
			)
		);

		return result;
	}

	private getClassesId(classes: Class[]): EntityId[] {
		return classes.map((item) => item.id);
	}
}
