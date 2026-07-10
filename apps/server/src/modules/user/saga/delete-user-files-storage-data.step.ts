import { FileDto, FilesStorageClientAdapterService } from '@infra/files-storage-amqp-client';
import { Logger } from '@infra/logger';
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

@Injectable()
export class DeleteUserFilesStorageDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.FILES_STORAGE;

	constructor(
		private readonly sagaService: SagaService,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
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
		const response = await this.filesStorageClientAdapterService.removeCreatorIdFromFileRecords(creatorId);

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			response.length,
			this.getFileRecordsId(response)
		);

		return result;
	}

	private getFileRecordsId(files: FileDto[]): EntityId[] {
		return files.map((file) => file.id);
	}
}
