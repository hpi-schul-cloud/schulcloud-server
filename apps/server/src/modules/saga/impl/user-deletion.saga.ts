import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SagaRegistryService, SagaStepRegistryService } from '../service';
import { ModuleName, StepReport } from '../type';
import { Saga } from '../type/saga';

export const UserDeletionSagaExecutionOrder: ModuleName[] = [
	ModuleName.ACCOUNT,
	ModuleName.MEDIA_BOARD,
	ModuleName.CLASS,
	ModuleName.COURSE,
	ModuleName.COURSE_COURSEGROUP,
	ModuleName.LEARNROOM_DASHBOARD,
	ModuleName.FILES,
	ModuleName.FILES_STORAGE,
	ModuleName.LESSON,
	ModuleName.PSEUDONYM,
	ModuleName.ROCKETCHATUSER,
	ModuleName.TASK,
	ModuleName.TASK_SUBMISSION,
	ModuleName.TEAM,
	ModuleName.USER_CALENDAR,
	// ModuleName.USER,
	ModuleName.USER_REGISTRATIONPIN,
	ModuleName.NEWS,
];

@Injectable()
export class UserDeletionSaga extends Saga<'userDeletion'> {
	constructor(
		private readonly stepRegistry: SagaStepRegistryService,
		private readonly sagaRegistry: SagaRegistryService
	) {
		super('userDeletion');
		this.sagaRegistry.registerSaga(this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport[]> {
		const moduleNames = UserDeletionSagaExecutionOrder;

		this.checkAllStepsRegistered([...moduleNames, ModuleName.USER]);

		const results = await Promise.allSettled(
			moduleNames.map((moduleName) =>
				this.stepRegistry.executeStep(moduleName, 'deleteUserData', {
					userId: params.userId,
				})
			)
		);

		const isRejected = (result: PromiseSettledResult<StepReport>) => result.status === 'rejected';
		const failedSteps = results.filter(isRejected);
		if (failedSteps.length > 0) {
			throw new Error(
				`Some steps failed: ${failedSteps.map((r: PromiseRejectedResult) => r.reason as string).join(', ')}`
			);
		}

		const successReports: StepReport[] = [];
		for (const result of results) {
			if (result.status === 'rejected') {
				continue; // Already handled above
			}
			const reports = Array.isArray(result.value) ? result.value : [result.value];
			successReports.push(...reports);
		}

		try {
			const userStepResult = await this.stepRegistry.executeStep(ModuleName.USER, 'deleteUserData', {
				userId: params.userId,
			});
			successReports.push(userStepResult);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to delete user data in USER module: ${message}`);
		}

		return successReports;
	}

	private checkAllStepsRegistered(moduleNames: ModuleName[]): void {
		for (const moduleName of moduleNames) {
			this.stepRegistry.checkStep(moduleName, 'deleteUserData');
		}
	}
}
