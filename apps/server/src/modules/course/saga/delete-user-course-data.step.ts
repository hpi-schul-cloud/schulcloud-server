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
import { CourseEntity, CourseRepo } from '../repo';

@Injectable()
export class DeleteUserCourseDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.COURSE;

	constructor(
		private readonly sagaService: SagaService,
		private readonly courseRepo: CourseRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserCourseDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const userReferencesRemoved = await this.removeUserReferences(userId);

		const result = StepReportBuilder.build(this.moduleName, [userReferencesRemoved]);

		return result;
	}

	public async removeUserReferences(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting user data from Courses',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);

		const [courses] = await this.courseRepo.findAllByUserId(userId);

		const count = await this.courseRepo.removeUserReference(userId);

		const result = StepOperationReportBuilder.build(StepOperationType.UPDATE, count, this.getCoursesId(courses));

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully removed user data from Courses',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				0,
				count
			)
		);

		return result;
	}

	private getCoursesId(courses: CourseEntity[]): EntityId[] {
		return courses.map((course) => course.id);
	}
}
