import { Injectable } from '@nestjs/common';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum, EntityId } from '@shared/domain';
import { CopyFileDto } from '../dto';
import { EntityWithEmbeddedFiles } from '../interfaces';
import { FileParamBuilder, CopyFilesOfParentParamBuilder } from '../mapper';
import { FilesStorageClientAdapterService } from './files-storage-client.service';

// TODO  missing FileCopyParams  ...passing user instead of userId

export type FileUrlReplacement = {
	regex: RegExp;
	replacement: string;
};
@Injectable()
export class CopyFilesService {
	constructor(
		private readonly copyHelperService: CopyHelperService,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async copyFilesOfEntity<T extends EntityWithEmbeddedFiles>(
		originalEntity: T,
		copyEntity: T,
		userId: EntityId
	): Promise<{
		fileUrlReplacements: FileUrlReplacement[];
		fileCopyStatus: CopyStatus;
	}> {
		const source = FileParamBuilder.build(originalEntity.getSchoolId(), originalEntity);
		const target = FileParamBuilder.build(copyEntity.getSchoolId(), copyEntity);
		const copyFilesOfParentParams = CopyFilesOfParentParamBuilder.build(userId, source, target);

		const fileDtos = await this.filesStorageClientAdapterService.copyFilesOfParent(copyFilesOfParentParams);
		const fileUrlReplacements = this.createFileUrlReplacements(fileDtos) ?? [];
		const fileCopyStatus = this.deriveCopyStatus(fileDtos);

		return { fileUrlReplacements, fileCopyStatus };
	}

	private createFileUrlReplacements(fileDtos: CopyFileDto[]): FileUrlReplacement[] {
		return fileDtos.map((fileDto) => {
			const { sourceId, id, name } = fileDto;
			return {
				regex: new RegExp(`${sourceId}.+?"`, 'g'),
				replacement: `${id ?? 'fileCouldNotBeCopied'}/failed-${name}"`,
			};
		});
	}

	private deriveCopyStatus(fileDtos: CopyFileDto[]): CopyStatus {
		const fileStatuses: CopyStatus[] = fileDtos.map(({ sourceId, id, name }) => ({
			type: CopyElementType.FILE,
			status: id ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
			title: name ?? `(old fileid: ${sourceId})`,
		}));

		const fileGroupStatus = {
			type: CopyElementType.FILE_GROUP,
			status: this.copyHelperService.deriveStatusFromElements(fileStatuses),
			elements: fileStatuses,
		};
		return fileGroupStatus;
	}
}
