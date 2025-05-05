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
import { FilesRepo } from '../repo';
import { FileEntity } from '../entity';

@Injectable()
export class DeleteUserFilesDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName: ModuleName = ModuleName.FILES;

	constructor(
		private readonly sagaService: SagaService,
		private readonly repo: FilesRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserFilesDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const [markedFilesForDeletion, removedUserPermissionsToFiles] = await Promise.all([
			this.markFilesOwnedByUserForDeletion(userId),
			this.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId),
		]);

		const result = StepReportBuilder.build(this.moduleName, [markedFilesForDeletion, removedUserPermissionsToFiles]);

		return result;
	}

	public async markFilesOwnedByUserForDeletion(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Marking user files to deletion',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);
		const entities = await this.repo.findByOwnerUserId(userId);

		entities.forEach((entity) => entity.markForDeletion());

		await this.repo.save(entities);

		const numberOfMarkedForDeletionFiles = entities.length;

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			numberOfMarkedForDeletionFiles,
			this.getFilesId(entities)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully marked user files for deletion',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				numberOfMarkedForDeletionFiles,
				0
			)
		);

		return result;
	}

	public async removeUserPermissionsOrCreatorReferenceToAnyFiles(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting user data from Files',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);
		const entities = await this.repo.findByPermissionRefIdOrCreatorId(userId);

		entities.forEach((entity) => {
			entity.removePermissionsByRefId(userId);
			entity.removeCreatorId(userId);
		});

		await this.repo.save(entities);

		const numberOfUpdatedFiles = entities.length;

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			numberOfUpdatedFiles,
			this.getFilesId(entities)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully removed user data from Files',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				numberOfUpdatedFiles,
				0
			)
		);

		return result;
	}

	private getFilesId(files: FileEntity[]): EntityId[] {
		return files.map((file) => file.id);
	}
}
