import { DomainName } from '@modules/deletion';
import { SagaCompensateFn, SagaInjectionService } from '@modules/saga';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { NewsRepo } from '@shared/repo/news';

@Injectable()
export class SagaInjectableService {
	constructor(
		private readonly sagaInjectionService: SagaInjectionService,
		private readonly newsRepo: NewsRepo
	) {
		this.sagaInjectionService.injectSagaStep({
			sagaName: 'user-deletion',
			stepName: 'delete-user-from-news',
			invoke: this.invokeUserDeletion.bind(this),
			metadata: {
				moduleName: DomainName.NEWS,
			}
		})
	}

	public async invokeUserDeletion(userId: EntityId): Promise<SagaCompensateFn> {
		if (!userId || typeof userId !== 'string') {
			throw new InternalServerErrorException('User id is missing');
		}

		const [newsWithUserData, counterOfNews] = await this.newsRepo.findByCreatorOrUpdaterId(userId);

		newsWithUserData.forEach((newsEntity) => {
			newsEntity.removeCreatorReference(userId);
			newsEntity.removeUpdaterReference(userId);
		});

		await this.newsRepo.save(newsWithUserData);

		console.log({
			message: 'Successfully removed user data from News',
			domain: DomainName.NEWS,
			user: userId,
			modifiedCount: counterOfNews,
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
