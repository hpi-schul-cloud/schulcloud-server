/* eslint-disable no-await-in-loop */
import { Injectable } from '@nestjs/common';
import { YMap } from 'yjs/dist/src/types/YMap';
import { YMongodb } from '../repo';
import { TldrawFilesStorageAdapterService } from '../service';
import { WsSharedDocDo } from '../domain';
import { TldrawAsset, TldrawShape } from '../types';

@Injectable()
export class TldrawDeleteFilesUc {
	constructor(private mdb: YMongodb, private filesStorageTldrawAdapterService: TldrawFilesStorageAdapterService) {}

	public async deleteUnusedFiles(thresholdDate: Date): Promise<void> {
		const docNames = await this.mdb.getAllDocumentNames();

		for (const docName of docNames) {
			const doc = await this.mdb.getDocument(docName);
			const usedAssets = this.getUsedAssetsFromDocument(doc);

			await this.filesStorageTldrawAdapterService.deleteUnusedFilesForDocument(docName, usedAssets, thresholdDate);
			doc.destroy();
		}
	}

	private getUsedAssetsFromDocument(doc: WsSharedDocDo): TldrawAsset[] {
		const assets: YMap<TldrawAsset> = doc.getMap('assets');
		const shapes: YMap<TldrawShape> = doc.getMap('shapes');
		const usedShapesAsAssets: TldrawShape[] = [];
		const usedAssets: TldrawAsset[] = [];

		for (const [, shape] of shapes) {
			if (shape.assetId) {
				usedShapesAsAssets.push(shape);
			}
		}

		for (const [, asset] of assets) {
			const foundAsset = usedShapesAsAssets.some((shape) => shape.assetId === asset.id);
			if (foundAsset) {
				usedAssets.push(asset);
			}
		}

		return usedAssets;
	}
}
