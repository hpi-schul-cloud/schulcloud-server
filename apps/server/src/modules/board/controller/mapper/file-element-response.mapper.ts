import { FileElement } from '@shared/domain';
import { ContentElementType } from '../../types/content-elements.enum';
import { FileElementContent, FileElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class FileElementResponseMapper implements BaseResponseMapper {
	private static instance: FileElementResponseMapper;

	public static getInstance(): FileElementResponseMapper {
		if (!FileElementResponseMapper.instance) {
			FileElementResponseMapper.instance = new FileElementResponseMapper();
		}

		return FileElementResponseMapper.instance;
	}

	mapToResponse(element: FileElement): FileElementResponse {
		const result = new FileElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.FILE,
			content: new FileElementContent({ caption: element.caption }),
		});

		return result;
	}

	canMap(element: FileElement): boolean {
		return element instanceof FileElement;
	}
}
