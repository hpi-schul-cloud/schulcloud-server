import { Injectable } from '@nestjs/common';
import { FileDto, FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { Task } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { CopyHelperService } from './copy-helper.service';

@Injectable()
export class FileCopyAppendService {
	constructor(
		private readonly copyHelperService: CopyHelperService,
		private readonly fileCopyAdapterService: FilesStorageClientAdapterService
	) {}

	// TODO create interfaces for params
	async appendFiles(copyStatus: CopyStatus, jwt: string): Promise<CopyStatus> {
		if (copyStatus.type === CopyElementType.TASK) {
			return this.appendFilesToTask(copyStatus, jwt);
		}
		if (copyStatus.elements && copyStatus.elements.length > 0) {
			copyStatus.elements = await Promise.all(copyStatus.elements.map((el) => this.appendFiles(el, jwt)));
			copyStatus.status = this.copyHelperService.deriveStatusFromElements(copyStatus.elements);
		}
		return Promise.resolve(copyStatus);
	}

	private async appendFilesToTask(taskCopyStatus: CopyStatus, jwt: string): Promise<CopyStatus> {
		const taskCopyStatusCopy = { ...taskCopyStatus };
		const fileGroupStatus = this.getFileGroupStatus(taskCopyStatus?.elements);
		if (
			taskCopyStatusCopy.copyEntity === undefined ||
			taskCopyStatusCopy.originalEntity === undefined ||
			fileGroupStatus === undefined
		) {
			return taskCopyStatusCopy;
		}
		try {
			const original: Task = taskCopyStatusCopy.originalEntity as Task;
			const copy: Task = taskCopyStatusCopy.copyEntity as Task;
			const source = FileParamBuilder.buildForTask(jwt, original.school.id, original.id);
			const target = FileParamBuilder.buildForTask(jwt, copy.school.id, copy.id);
			console.log('copyFilesOfParent-start');
			const files = await this.fileCopyAdapterService.copyFilesOfParent(source, target);
			console.log('copyFilesOfParent-end');
			return this.createSuccessCopyStatus(taskCopyStatusCopy, files);
		} catch (err) {
			console.log('copyFilesOfParent-err');
			return this.createFailedCopyStatus(taskCopyStatusCopy);
		}
	}

	private createSuccessCopyStatus(taskCopyStatus: CopyStatus, files: FileDto[]): CopyStatus {
		const fileGroupStatus = {
			type: CopyElementType.FILE_GROUP,
			status: CopyStatusEnum.SUCCESS,
			elements: this.createFileStatuses(files),
		};
		taskCopyStatus.status = this.copyHelperService.deriveStatusFromElements(taskCopyStatus.elements as CopyStatus[]);
		taskCopyStatus.elements = this.replaceFileGroup(taskCopyStatus.elements, fileGroupStatus);
		return taskCopyStatus;
	}

	private createFailedCopyStatus(taskCopyStatus: CopyStatus) {
		const fileGroupStatus = this.getFileGroupStatus(taskCopyStatus?.elements);
		const updatedFileGroupStatus = {
			...fileGroupStatus,
			status: CopyStatusEnum.FAIL,
			elements:
				fileGroupStatus.elements?.map((el) => {
					el.status = CopyStatusEnum.FAIL;
					return el;
				}) ?? [],
		};
		taskCopyStatus.status = this.copyHelperService.deriveStatusFromElements(taskCopyStatus.elements as CopyStatus[]);
		taskCopyStatus.elements = this.replaceFileGroup(taskCopyStatus.elements, updatedFileGroupStatus);
		return taskCopyStatus;
	}

	private getFileGroupStatus(elements: CopyStatus[] = []): CopyStatus {
		return elements?.find((el) => el.type === CopyElementType.FILE_GROUP) as CopyStatus;
	}

	private replaceFileGroup(elements: CopyStatus[] = [], fileGroupStatus: CopyStatus): CopyStatus[] {
		return elements.map((el) => (el.type === CopyElementType.FILE_GROUP ? fileGroupStatus : el));
	}

	private createFileStatuses(files: FileDto[]): CopyStatus[] {
		return files.map((file) => ({
			type: CopyElementType.FILE,
			name: file.name,
			status: CopyStatusEnum.SUCCESS,
		}));
	}
}
