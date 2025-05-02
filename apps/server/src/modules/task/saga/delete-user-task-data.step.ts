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
import { TaskService } from '..';
import { Task, TaskRepo } from '../repo';

@Injectable()
export class DeleteUserTaskDataStep extends SagaStep<'deleteUserData'> {
	constructor(
		private readonly sagaService: SagaService,
		private readonly taskService: TaskService,
		private readonly taskRepo: TaskRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserTaskDataStep.name);
		this.sagaService.registerStep(ModuleName.TASK, this);
	}
	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId: creatorId } = params;

		const [tasksDeleted, tasksModifiedByRemoveCreator, tasksModifiedByRemoveUserFromFinished] = await Promise.all([
			this.deleteTasksByOnlyCreator(creatorId),
			this.removeCreatorIdFromTasks(creatorId),
			this.removeUserFromFinished(creatorId),
		]);

		const modifiedTasksCount = tasksModifiedByRemoveCreator.count + tasksModifiedByRemoveUserFromFinished.count;
		const modifiedTasksRef = [...tasksModifiedByRemoveCreator.refs, ...tasksModifiedByRemoveUserFromFinished.refs];

		const result = StepReportBuilder.build(ModuleName.TASK, [
			tasksDeleted,
			StepOperationReportBuilder.build(StepOperationType.UPDATE, modifiedTasksCount, modifiedTasksRef),
		]);

		return result;
	}

	public async deleteTasksByOnlyCreator(creatorId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable('Deleting data from Task', ModuleName.TASK, creatorId, StepStatus.PENDING)
		);

		const [tasksByOnlyCreatorId, counterOfTasksOnlyWithCreatorId] = await this.taskRepo.findByOnlyCreatorId(creatorId);

		if (counterOfTasksOnlyWithCreatorId > 0) {
			const promiseDeletedTasks = tasksByOnlyCreatorId.map((task: Task) => this.taskService.delete(task));
			await Promise.all(promiseDeletedTasks);
		}

		const result = StepOperationReportBuilder.build(
			StepOperationType.DELETE,
			counterOfTasksOnlyWithCreatorId,
			this.getTasksId(tasksByOnlyCreatorId)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted data from Task',
				ModuleName.TASK,
				creatorId,
				StepStatus.FINISHED,
				counterOfTasksOnlyWithCreatorId,
				0
			)
		);

		return result;
	}

	public async removeCreatorIdFromTasks(creatorId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting user data from Task',
				ModuleName.TASK,
				creatorId,
				StepStatus.PENDING
			)
		);
		const [tasksByCreatorIdWithCoursesAndLessons, counterOfTasksWithCoursesorLessons] =
			await this.taskRepo.findByCreatorIdWithCourseAndLesson(creatorId);

		if (counterOfTasksWithCoursesorLessons > 0) {
			tasksByCreatorIdWithCoursesAndLessons.forEach((task: Task) => task.removeCreatorId());
			await this.taskRepo.save(tasksByCreatorIdWithCoursesAndLessons);
		}

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			counterOfTasksWithCoursesorLessons,
			this.getTasksId(tasksByCreatorIdWithCoursesAndLessons)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted user data from Task',
				ModuleName.TASK,
				creatorId,
				StepStatus.FINISHED,
				counterOfTasksWithCoursesorLessons,
				0
			)
		);
		return result;
	}

	public async removeUserFromFinished(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting user data from Task archive collection',
				ModuleName.TASK,
				userId,
				StepStatus.PENDING
			)
		);
		const [tasksWithUserInFinished, counterOfTasksWithUserInFinished] = await this.taskRepo.findByUserIdInFinished(
			userId
		);

		if (counterOfTasksWithUserInFinished > 0) {
			tasksWithUserInFinished.forEach((task: Task) => task.removeUserFromFinished(userId));

			await this.taskRepo.save(tasksWithUserInFinished);
		}

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			counterOfTasksWithUserInFinished,
			this.getTasksId(tasksWithUserInFinished)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted user data from Task archive collection',
				ModuleName.TASK,
				userId,
				StepStatus.FINISHED,
				counterOfTasksWithUserInFinished,
				0
			)
		);

		return result;
	}

	private getTasksId(tasks: Task[]): EntityId[] {
		return tasks.map((task) => task.id);
	}
}
