import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SagaRegistryService, SagaStepRegistryService } from '../service';
import { ModuleName } from '../type';
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

	public async execute(params: { userId: EntityId }): Promise<boolean> {
		console.log('Executing userDeletion with userId:', params.userId);

		// TODO make sure all necessary steps are registered

		await this.stepRegistry.executeStep(ModuleName.TASK_SUBMISSION, 'deleteUserData', {
			userId: params.userId,
		});

		await this.stepRegistry.executeStep(ModuleName.TASK, 'deleteUserData', {
			userId: params.userId,
		});

		return await Promise.resolve(true);
	}
}
