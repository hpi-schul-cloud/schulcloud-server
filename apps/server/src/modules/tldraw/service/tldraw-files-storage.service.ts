import { Injectable } from '@nestjs/common';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { TldrawAsset } from '../types';

@Injectable()
export class TldrawFilesStorageAdapterService {
	constructor(private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService) {}

	public async deleteUnusedFilesForDocument(docName: string, usedAssets: TldrawAsset[]) {
		const fileRecords = await this.filesStorageClientAdapterService.listFilesOfParent(docName);

		const deleteFilePromises = fileRecords.map((fileRecord) =>
			this.createFileDeletionActionWhenAssetNotExists(fileRecord, usedAssets)
		);

		await Promise.allSettled(deleteFilePromises);
	}

	private createFileDeletionActionWhenAssetNotExists(fileRecord: FileDto, usedAssets: TldrawAsset[]) {
		const foundAsset = usedAssets.find((asset) => this.matchAssetWithFileRecord(asset, fileRecord));
		const promise = foundAsset ? Promise.resolve() : this.filesStorageClientAdapterService.deleteOneFile(fileRecord.id);

		return promise;
	}

	private matchAssetWithFileRecord(asset: TldrawAsset, fileRecord: FileDto) {
		const srcArr = asset.src.split('/');
		const fileRecordId = srcArr[srcArr.length - 2];

		return fileRecordId === fileRecord.id;
	}
}
