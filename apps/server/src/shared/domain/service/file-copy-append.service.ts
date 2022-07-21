import { Injectable } from '@nestjs/common';
import { FileDto, FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules';
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
	// TODO move spread copy to beginning of appendFilesToTask()
	async appendFiles(copyStatus: CopyStatus, jwt: string): Promise<CopyStatus> {
		if (copyStatus.type === CopyElementType.TASK) {
			return this.appendFilesToTask(copyStatus as CopyStatus, jwt);
		}
		if (copyStatus.elements && copyStatus.elements.length > 0) {
			copyStatus.elements = await Promise.all(copyStatus.elements.map((el) => this.appendFiles(el, jwt)));
			copyStatus.status = this.copyHelperService.deriveStatusFromElements(copyStatus.elements);
		}
		return Promise.resolve(copyStatus);
	}

	async appendFilesToTask(taskCopyStatus: CopyStatus, jwt: string): Promise<CopyStatus> {
		if (taskCopyStatus.copyEntity === undefined || taskCopyStatus.originalEntity === undefined) {
			return taskCopyStatus;
		}
		try {
			const original: Task = taskCopyStatus.originalEntity as Task;
			const copy: Task = taskCopyStatus.copyEntity as Task;
			const source = FileParamBuilder.buildForTask(jwt, original.school.id, original.id);
			const target = FileParamBuilder.buildForTask(jwt, copy.school.id, copy.id);
			const files = await this.fileCopyAdapterService.copyFilesOfParent(source, target);
			return this.createSuccessCopyStatus(taskCopyStatus, files);
		} catch (err) {
			return this.createFailedCopyStatus(taskCopyStatus);
		}
	}

	private createSuccessCopyStatus(taskStatus: CopyStatus, files: FileDto[]): CopyStatus {
		const fileGroupStatus = {
			type: CopyElementType.FILE_GROUP,
			status: CopyStatusEnum.SUCCESS,
			elements: this.createFileStatuses(files),
		};
		return {
			...taskStatus,
			status: this.copyHelperService.deriveStatusFromElements(taskStatus.elements as CopyStatus[]),
			elements: this.replaceFileGroup(taskStatus.elements, fileGroupStatus),
		};
	}

	private createFailedCopyStatus(taskStatus: CopyStatus) {
		const fileGroupStatus = this.getFileGroupStatus(taskStatus?.elements);
		const updatedFileGroupStatus = {
			...fileGroupStatus,
			status: CopyStatusEnum.FAIL,
			elements:
				fileGroupStatus.elements?.map((el) => {
					el.status = CopyStatusEnum.FAIL;
					return el;
				}) ?? [],
		};
		return {
			...taskStatus,
			status: this.copyHelperService.deriveStatusFromElements(taskStatus.elements as CopyStatus[]),
			elements: this.replaceFileGroup(taskStatus.elements, updatedFileGroupStatus),
		};
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
