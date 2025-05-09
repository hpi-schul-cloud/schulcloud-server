import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SagaRegistryService, SagaStepRegistryService } from '../service';
import { ModuleName, StepReport } from '../type';
import { Saga } from '../type/saga';

@Injectable()
export class UserDeletionSaga extends Saga<'userDeletion'> {
	private readonly executionOrder = [
		ModuleName.ACCOUNT,
		ModuleName.BOARD,
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
		ModuleName.USER,
		ModuleName.USER_CALENDAR,
		ModuleName.USER_REGISTRATIONPIN,
		ModuleName.NEWS,
	];

	constructor(
		private readonly stepRegistry: SagaStepRegistryService,
		private readonly sagaRegistry: SagaRegistryService
	) {
		super('userDeletion');
		this.sagaRegistry.registerSaga(this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport[]> {
		const moduleNames = this.executionOrder;

		this.checkAllStepsRegistered(moduleNames);

		const results = await Promise.allSettled(
			moduleNames.map((moduleName) =>
				this.stepRegistry.executeStep(moduleName, 'deleteUserData', {
					userId: params.userId,
				})
			)
		);

		const successReports: StepReport[] = [];

		for (const result of results) {
			if (result.status === 'rejected') {
				throw new Error(`Step failed: ${result.reason as string}`);
			} else {
				const reports = Array.isArray(result.value) ? result.value : [result.value];
				successReports.push(...reports);
			}
		}

		return successReports;
	}

	private checkAllStepsRegistered(moduleNames: ModuleName[]): void {
		for (const moduleName of moduleNames) {
			this.stepRegistry.checkStep(moduleName, 'deleteUserData');
		}
	}
}
