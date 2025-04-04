import { DomainName } from '@modules/deletion';
import { SagaService, SagaStep } from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { NewsRepo } from '@shared/repo/news';

@Injectable()
export class DeleteUserReferenceFromNewsStep extends SagaStep<'deleteUserReference'> {
	constructor(private readonly newsRepo: NewsRepo, private readonly sagaService: SagaService) {
		super('deleteUserReference');
		this.sagaService.registerStep('news', this);
	}

	public async execute(params: { userId: EntityId }): Promise<boolean> {
		const { userId } = params;

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
			deletedCount: 0,
		});

		return true;
	}

	public compensate(params: { userId: EntityId }): Promise<void> {
		console.log('Compensating deleteUserReferenceFromNewsStep with params:', params);
		return Promise.resolve();
	}
}
