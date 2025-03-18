import { EntityId } from '@shared/domain/types';
import { SagaStepRegistryService } from '../service';
import { Saga } from '../type';

export class UserDeletionSaga extends Saga<'userDeletion'> {
	constructor(protected readonly stepRegistry: SagaStepRegistryService) {
		super('userDeletion', stepRegistry);
	}

	public async execute(params: { userId: EntityId }): Promise<boolean> {
		console.log('Executing userDeletion with userId:', params.userId);

		const deleteUserReferenceFromClassResult = await this.stepRegistry.executeStep('class', 'deleteUserReference', {
			userId: params.userId,
		});

		return deleteUserReferenceFromClassResult;
	}
}
