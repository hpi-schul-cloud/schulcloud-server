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
import { CourseGroupEntity, CourseGroupRepo } from '../repo';

@Injectable()
export class DeleteUserCourseGroupDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.COURSE_COURSEGROUP;

	constructor(
		private readonly sagaService: SagaService,
		private readonly courseGroupRepo: CourseGroupRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserCourseGroupDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const userReferencesRemoved = await this.removeUserReferences(userId);

		// TODO: do we have to implement removeCourseSyncReferences?
		// see: GroupDeletedHandlerService

		const result = StepReportBuilder.build(this.moduleName, [userReferencesRemoved]);

		return result;
	}

	public async removeUserReferences(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Removing user from course groups',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);
		const [courseGroups] = await this.courseGroupRepo.findByUserId(userId);

		const count = await this.courseGroupRepo.removeUserReference(userId);

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			count,
			this.getCourseGroupsId(courseGroups)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully removed user from course groups',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				count,
				0
			)
		);

		return result;
	}

	private getCourseGroupsId(courseGroups: CourseGroupEntity[]): EntityId[] {
		return courseGroups.map((courseGroup) => courseGroup.id);
	}
}
