import { Injectable } from '@nestjs/common';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { TldrawAsset } from '../types';

@Injectable()
export class TldrawFilesStorageAdapterService {
	constructor(private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService) {}

	public async deleteUnusedFilesForDocument(docName: string, usedAssets: TldrawAsset[]): Promise<void> {
		const fileRecords = await this.filesStorageClientAdapterService.listFilesOfParent(docName);
		const fileRecordIdsForDeletion: string[] = [];

		fileRecords.forEach((fileRecord) => {
			const asset = this.foundAssetsForDeletion(fileRecord, usedAssets);
			if (asset) {
				fileRecordIdsForDeletion.push(fileRecord.id);
			}
		});

		await this.filesStorageClientAdapterService.deleteFiles(fileRecordIdsForDeletion);
	}

	private foundAssetsForDeletion(fileRecord: FileDto, usedAssets: TldrawAsset[]): TldrawAsset | undefined {
		const foundAsset = usedAssets.find((asset) => this.matchAssetWithFileRecord(asset, fileRecord));

		return foundAsset;
	}

	private matchAssetWithFileRecord(asset: TldrawAsset, fileRecord: FileDto) {
		const srcArr = asset.src.split('/');
		const fileRecordId = srcArr[srcArr.length - 2];

		return fileRecordId === fileRecord.id;
	}
}
