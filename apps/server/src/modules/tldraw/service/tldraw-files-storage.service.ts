import { Injectable } from '@nestjs/common';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { TldrawAsset } from '../types';

@Injectable()
export class TldrawFilesStorageAdapterService {
	constructor(private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService) {}

	public async deleteUnusedFilesForDocument(docName: string, usedAssets: TldrawAsset[]) {
		const deleteFilePromises: Promise<FileDto>[] = [];
		const fileRecords = await this.filesStorageClientAdapterService.listFilesOfParent(docName);
		for (const fileRecord of fileRecords) {
			const foundAsset = usedAssets.find((asset) => {
				const srcArr = asset.src.split('/');
				const fileRecordId = srcArr[srcArr.length - 2];

				return fileRecordId === fileRecord.id;
			});

			if (!foundAsset) {
				deleteFilePromises.push(this.filesStorageClientAdapterService.deleteOneFile(fileRecord.id));
			}
		}

		await Promise.allSettled(deleteFilePromises);
	}
}
