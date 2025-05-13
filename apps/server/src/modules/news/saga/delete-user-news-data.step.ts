import { Logger } from '@core/logger';
import {
	ModuleName,
	SagaService,
	SagaStep,
	StepOperationReport,
	StepOperationReportBuilder,
	StepOperationType,
	StepReport,
	StepReportBuilder,
	StepStatus,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { News, NewsRepo } from '../repo';

@Injectable()
export class DeleteUserNewsDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.NEWS;

	constructor(
		private readonly sagaService: SagaService,
		private readonly newsRepo: NewsRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserNewsDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const userReferencesRemoved = await this.removeUserReferences(userId);

		const result = StepReportBuilder.build(this.moduleName, [userReferencesRemoved]);

		return result;
	}

	public async removeUserReferences(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable('Deleting user data from News', this.moduleName, userId, StepStatus.PENDING)
		);

		const [newsWithUserData, counterOfNews] = await this.newsRepo.findByCreatorOrUpdaterId(userId);

		await this.newsRepo.removeUserReference(userId);

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			counterOfNews,
			this.getNewsId(newsWithUserData)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully removed user data from News',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				counterOfNews,
				0
			)
		);
		return result;
	}

	private getNewsId(news: News[]): EntityId[] {
		return news.map((item) => item.id);
	}
}
