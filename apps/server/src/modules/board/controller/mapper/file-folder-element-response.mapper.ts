import { ContentElementType, FileFolderElement } from '../../domain';
import { FileFolderElementContent, FileFolderElementResponse } from '../dto/element/file-folder-element.response';
import { TimestampsResponse } from '../dto/timestamps.response';
import type { BaseResponseMapper } from './base-mapper.interface';

export class FileFolderElementResponseMapper implements BaseResponseMapper {
	private static instance: FileFolderElementResponseMapper;

	public static getInstance(): FileFolderElementResponseMapper {
		if (!FileFolderElementResponseMapper.instance) {
			FileFolderElementResponseMapper.instance = new FileFolderElementResponseMapper();
		}
		return FileFolderElementResponseMapper.instance;
	}

	public canMap(element: unknown): element is FileFolderElement {
		return element instanceof FileFolderElement;
	}

	public mapToResponse(element: FileFolderElement): FileFolderElementResponse {
		const result = new FileFolderElementResponse({
			id: element.id,
			type: ContentElementType.FILE_FOLDER,
			content: new FileFolderElementContent({
				title: element.title,
			}),
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
		});

		return result;
	}
}
