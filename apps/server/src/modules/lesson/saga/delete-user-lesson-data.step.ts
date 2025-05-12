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
import { LessonEntity, LessonRepo } from '../repo';

@Injectable()
export class DeleteUserLessonDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.LESSON;

	constructor(
		private readonly sagaService: SagaService,
		private readonly lessonRepo: LessonRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserLessonDataStep.name);
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
				'Deleting user data from Lessons',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);
		const lessons = await this.lessonRepo.findByUserId(userId);
		const lessonIds = this.getLessonsId(lessons);

		const numberOfUpdatedLessons = await this.lessonRepo.removeUserReference(userId);

		const result = StepOperationReportBuilder.build(StepOperationType.UPDATE, numberOfUpdatedLessons, lessonIds);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully removed user data from Lessons',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				numberOfUpdatedLessons,
				0
			)
		);

		return result;
	}

	private getLessonsId(lessons: LessonEntity[]): EntityId[] {
		return lessons.map((lesson) => lesson.id);
	}
}
