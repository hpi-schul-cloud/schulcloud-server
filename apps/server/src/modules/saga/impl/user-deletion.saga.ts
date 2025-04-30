import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SagaRegistryService, SagaStepRegistryService } from '../service';
import { Saga } from '../type/saga';

@Injectable()
export class UserDeletionSaga extends Saga<'userDeletion'> {
	constructor(
		private readonly stepRegistry: SagaStepRegistryService,
		private readonly sagaRegistry: SagaRegistryService
	) {
		super('userDeletion');
		sagaRegistry.registerSaga(this);
	}

	public async execute(params: { userId: EntityId }): Promise<boolean> {
		console.log('Executing userDeletion with userId:', params.userId);

		// const deleteUserDataFromClassReport = await this.stepRegistry.executeStep('class', 'deleteUserData', {
		// 	userId: params.userId,
		// });

		// console.log('deleteUserDataFromClassReport:', deleteUserDataFromClassReport);

		return await Promise.resolve(true);
	}
}
