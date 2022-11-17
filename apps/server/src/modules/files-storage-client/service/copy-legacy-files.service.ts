import { Injectable } from '@nestjs/common';
import { CopyHelperService, CopyStatusEnum, CopyElementType, CopyStatus } from '@shared/domain';
import { FileLegacyResponse, FileLegacyService } from '@shared/domain/service/file-legacy.service';
import { FileUrlReplacement } from './copy-files.service';

@Injectable()
export class CopyLegacyFilesService {
	constructor(
		private readonly copyHelperService: CopyHelperService,
		private readonly fileLegacyService: FileLegacyService
	) {}

	async copyLegacyFiles(legacyFileIds: string[], targetCourseId: string, userId: string) {
		const fileCopyResults = await Promise.all(
			legacyFileIds.map((fileId) => this.fileLegacyService.copyFile({ fileId, targetCourseId, userId }))
		);
		const fileUrlReplacements = this.createFileUrlReplacements(fileCopyResults);
		const copyStatus = this.deriveCopyStatus(fileCopyResults);

		return { fileUrlReplacements, copyStatus };
	}

	private createFileUrlReplacements(fileCopyResults: FileLegacyResponse[]): FileUrlReplacement[] {
		return fileCopyResults.map(({ oldFileId, fileId, filename }) => {
			const regex = new RegExp(`"(https?://[^"]*)?/files/file\\?file=${oldFileId}.+?"`, 'g');
			let replacement = '"#"';
			if (fileId && filename) {
				replacement = `"/files/file?file=${fileId}&amp;name=${filename}"`;
			}
			return { regex, replacement };
		});
	}

	private deriveCopyStatus(fileCopyResults: FileLegacyResponse[]): CopyStatus {
		const fileStatuses: CopyStatus[] = fileCopyResults.map(({ oldFileId, fileId, filename }) => ({
			type: CopyElementType.FILE,
			status: fileId ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
			title: filename ?? `(old fileid: ${oldFileId})`,
		}));

		const fileGroupStatus = {
			type: CopyElementType.FILE_GROUP,
			status: this.copyHelperService.deriveStatusFromElements(fileStatuses),
			elements: fileStatuses,
		};
		return fileGroupStatus;
	}
}
