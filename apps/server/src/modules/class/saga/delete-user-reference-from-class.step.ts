import { DomainName } from '@modules/deletion';
import { SagaService, SagaStep } from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Class } from '../domain';
import { ClassesRepo } from '../repo';

@Injectable()
export class DeleteUserReferenceFromClassStep extends SagaStep<'deleteUserReference'> {
	constructor(private readonly classesRepo: ClassesRepo, private readonly sagaService: SagaService) {
		super('deleteUserReference');
		this.sagaService.registerStep('class', this);
	}

	public async execute(params: { userId: EntityId }): Promise<boolean> {
		const { userId } = params;

		const domainObjects = await this.classesRepo.findAllByUserId(userId);

		const updatedClasses: Class[] = domainObjects.map((domainObject) => {
			if (domainObject.userIds !== undefined) {
				domainObject.removeUser(userId);
			}
			return domainObject;
		});

		const numberOfUpdatedClasses = updatedClasses.length;

		await this.classesRepo.updateMany(updatedClasses);

		// TODO use logger instead
		console.log({
			message: 'Successfully removed user data from Classes',
			domain: DomainName.CLASS,
			user: userId,
			modifiedCount: numberOfUpdatedClasses,
			deletedCount: 0,
		});

		return true;
	}

	public compensate(params: { userId: EntityId }): Promise<void> {
		console.log('Compensating deleteUserReferenceFromClassStep with params:', params);
		return Promise.resolve();
	}
}
