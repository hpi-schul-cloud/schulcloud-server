import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { StorageLocation } from '@modules/files-storage/entity';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CopyFileDto } from '../dto';
import { EntityWithEmbeddedFiles, FileUrlReplacement } from '../interfaces';
import { CopyFilesOfParentParamBuilder, FileParamBuilder } from '../mapper';
import { FilesStorageClientAdapterService } from './files-storage-client.service';

const FILE_COULD_NOT_BE_COPIED_HINT = 'fileCouldNotBeCopied';

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
		const source = FileParamBuilder.build(originalEntity.getSchoolId(), originalEntity, StorageLocation.SCHOOL);
		const target = FileParamBuilder.build(copyEntity.getSchoolId(), copyEntity, StorageLocation.SCHOOL);
		const copyFilesOfParentParams = CopyFilesOfParentParamBuilder.build(userId, source, target);

		const fileDtos = await this.filesStorageClientAdapterService.copyFilesOfParent(copyFilesOfParentParams);
		const fileUrlReplacements = this.createFileUrlReplacements(fileDtos);
		const fileCopyStatus = this.deriveCopyStatus(fileDtos);

		return { fileUrlReplacements, fileCopyStatus };
	}

	private createFileUrlReplacements(fileDtos: CopyFileDto[]): FileUrlReplacement[] {
		return fileDtos.map((fileDto): FileUrlReplacement => {
			const { sourceId, id, name } = fileDto;

			// use hint as id replacement, if file could not be copied
			const newId = id ?? FILE_COULD_NOT_BE_COPIED_HINT;

			const fileUrlReplacement: FileUrlReplacement = {
				regex: new RegExp(`${sourceId}.+?"`, 'g'),
				replacement: `${newId}/${name}"`,
			};

			return fileUrlReplacement;
		});
	}

	private deriveCopyStatus(fileDtos: CopyFileDto[]): CopyStatus {
		const fileStatuses: CopyStatus[] = fileDtos.map(({ sourceId, id, name }) => {
			const result = {
				type: CopyElementType.FILE,
				status: id ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
				title: name ?? `(old fileid: ${sourceId})`,
			};
			return result;
		});

		const fileGroupStatus = {
			type: CopyElementType.FILE_GROUP,
			status: this.copyHelperService.deriveStatusFromElements(fileStatuses),
			elements: fileStatuses,
		};

		return fileGroupStatus;
	}
}
