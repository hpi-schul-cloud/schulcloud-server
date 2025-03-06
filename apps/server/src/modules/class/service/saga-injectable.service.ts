import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DomainName } from '@modules/deletion';
import { SagaCompensateFn, SagaInjectionService } from '@modules/saga';
import { EntityId } from '@shared/domain/types';
import { Class } from '../domain';
import { ClassesRepo } from '../repo';

@Injectable()
export class SagaInjectableService {
	constructor(
		private readonly sagaInjectionService: SagaInjectionService,
		private readonly classesRepo: ClassesRepo
	) {
		this.sagaInjectionService.injectSagaStep({
			sagaName: 'user-deletion',
			stepName: 'class-user-deletion',
			invoke: this.invokeUserDeletion.bind(this),
			metadata: {
				moduleName: DomainName.CLASS,
			}
		})
	}

	public async invokeUserDeletion(userId: EntityId): Promise<SagaCompensateFn> {
		if (!userId || typeof userId !== 'string') {
			throw new InternalServerErrorException('User id is missing');
		}

		const domainObjects = await this.classesRepo.findAllByUserId(userId);

		const updatedClasses: Class[] = domainObjects.map((domainObject) => {
			if (domainObject.userIds !== undefined) {
				domainObject.removeUser(userId);
			}
			return domainObject;
		});

		const numberOfUpdatedClasses = updatedClasses.length;

		await this.classesRepo.updateMany(updatedClasses);

		// use logger instead
		console.log({
			message: 'Successfully removed user data from Classes',
			domain: DomainName.CLASS,
			user: userId,
			modifiedCount: numberOfUpdatedClasses,
			deletedCount: 0
		});

		// returns compensation function
		return async () => this.compensateUserDeletion(userId);
	}

	// TODO: Implement this method
	private async compensateUserDeletion(userId: EntityId): Promise<void> {
		throw new Error('Not implemented');
	}

}
