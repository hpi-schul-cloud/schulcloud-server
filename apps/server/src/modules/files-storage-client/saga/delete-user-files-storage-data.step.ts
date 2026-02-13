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
} from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { FileDO } from '../interfaces';
import { FilesStorageProducer } from '../service';

@Injectable()
export class DeleteUserFilesStorageDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.FILES_STORAGE;

	constructor(
		private readonly sagaService: SagaService,
		private readonly fileStorageMQProducer: FilesStorageProducer,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserFilesStorageDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const userReferencesRemoved = await this.removeUserReferences(userId);

		const result = StepReportBuilder.build(this.moduleName, [userReferencesRemoved]);

		return result;
	}

	public async removeUserReferences(creatorId: EntityId): Promise<StepOperationReport> {
		const response = await this.fileStorageMQProducer.removeCreatorIdFromFileRecords(creatorId);

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			response.length,
			this.getFileRecordsId(response)
		);

		return result;
	}

	private getFileRecordsId(files: FileDO[]): EntityId[] {
		return files.map((file) => file.id);
	}
}
