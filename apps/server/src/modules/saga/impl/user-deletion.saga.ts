import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SagaRegistryService, SagaStepRegistryService } from '../service';
import { ModuleName, StepReport } from '../type';
import { Saga } from '../type/saga';

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
		console.log('Executing userDeletion with userId:', params.userId);

		// TODO define proper sequence of steps
		const moduleNames = Object.values(ModuleName);

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
