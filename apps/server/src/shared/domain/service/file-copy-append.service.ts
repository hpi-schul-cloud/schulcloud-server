import { Injectable } from '@nestjs/common';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules';
import { Task } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
// import { CopyHelperService } from './copy-helper.service';

@Injectable()
export class FileCopyAppendService {
	constructor(
		// private readonly copyHelperService: CopyHelperService,
		private readonly fileCopyAdapterService: FilesStorageClientAdapterService
	) {}

	async appendFiles(copyStatus: CopyStatus, jwt: string): Promise<CopyStatus> {
		if (copyStatus.type === CopyElementType.TASK) {
			return this.appendFilesToTask(copyStatus, jwt);
		}
		if (copyStatus.elements && copyStatus.elements.length > 0) {
			copyStatus.elements = await Promise.all(copyStatus.elements.map((el) => this.appendFiles(el, jwt)));
			// copyStatus.status = this.copyHelperService.deriveStatusFromElements(copyStatus.elements);
		}
		// TODO: take care for children (= .elements)
		return Promise.resolve(copyStatus);
	}

	async appendFilesToTask(taskStatus: CopyStatus, jwt: string): Promise<CopyStatus> {
		const copy = taskStatus.copyEntity as Task;
		const original = taskStatus.originalEntity as Task;
		const source = FileParamBuilder.buildForTask(jwt, original.school.id, original.id);
		const target = FileParamBuilder.buildForTask(jwt, copy.school.id, copy.id);
		let fileGroupStatus: CopyStatus;
		try {
			const files = await this.fileCopyAdapterService.copyFilesOfParent(source, target);
			fileGroupStatus = {
				type: CopyElementType.FILE_GROUP,
				status: CopyStatusEnum.SUCCESS,
				elements: files.map((file) => ({
					type: CopyElementType.FILE,
					name: file.name,
					status: CopyStatusEnum.SUCCESS,
				})),
			};
			taskStatus.status = CopyStatusEnum.SUCCESS;
		} catch (err) {
			fileGroupStatus = taskStatus?.elements?.find((el) => el.type === CopyElementType.FILE_GROUP) as CopyStatus;
			fileGroupStatus.status = CopyStatusEnum.FAIL;
			fileGroupStatus.elements = fileGroupStatus.elements?.map((el) => {
				el.status = CopyStatusEnum.FAIL;
				return el;
			});
			// TODO: find out how to give more information on fails / successes
		}
		taskStatus.elements = taskStatus.elements?.map((el) =>
			el.type === CopyElementType.FILE_GROUP ? fileGroupStatus : el
		);
		taskStatus.status = CopyStatusEnum.PARTIAL;
		return taskStatus;
	}
}
