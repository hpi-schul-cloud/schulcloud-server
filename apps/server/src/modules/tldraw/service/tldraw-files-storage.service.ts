import { Injectable } from '@nestjs/common';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { TldrawAsset } from '../types';

@Injectable()
export class TldrawFilesStorageAdapterService {
	constructor(private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService) {}

	public async deleteUnusedFilesForDocument(docName: string, usedAssets: TldrawAsset[]): Promise<void> {
		const fileRecords = await this.filesStorageClientAdapterService.listFilesOfParent(docName);
		const fileRecordIdsForDeletion = this.foundAssetsForDeletion(fileRecords, usedAssets);

		if (fileRecordIdsForDeletion.length === 0) {
			return;
		}

		await this.filesStorageClientAdapterService.deleteFiles(fileRecordIdsForDeletion);
	}

	private foundAssetsForDeletion(fileRecords: FileDto[], usedAssets: TldrawAsset[]): string[] {
		const fileRecordIdsForDeletion: string[] = [];

		for (const fileRecord of fileRecords) {
			const foundAsset = usedAssets.some((asset) => this.matchAssetWithFileRecord(asset, fileRecord));
			if (!foundAsset) {
				fileRecordIdsForDeletion.push(fileRecord.id);
			}
		}

		return fileRecordIdsForDeletion;
	}

	private matchAssetWithFileRecord(asset: TldrawAsset, fileRecord: FileDto) {
		const srcArr = asset.src.split('/');
		const fileRecordId = srcArr[srcArr.length - 2];

		return fileRecordId === fileRecord.id;
	}
}
