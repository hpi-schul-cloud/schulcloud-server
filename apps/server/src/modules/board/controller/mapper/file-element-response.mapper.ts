import { ContentElementType, FileElement } from '../../domain';
import { FileElementContent, FileElementResponse, TimestampsResponse } from '../dto';
import { type BaseResponseMapper } from './base-mapper.interface';

export class FileElementResponseMapper implements BaseResponseMapper {
	private static instance: FileElementResponseMapper;

	public static getInstance(): FileElementResponseMapper {
		if (!FileElementResponseMapper.instance) {
			FileElementResponseMapper.instance = new FileElementResponseMapper();
		}

		return FileElementResponseMapper.instance;
	}

	public mapToResponse(element: FileElement): FileElementResponse {
		const result = new FileElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.FILE,
			content: new FileElementContent({ caption: element.caption, alternativeText: element.alternativeText }),
		});

		return result;
	}

	public canMap(element: unknown): boolean {
		return element instanceof FileElement;
	}
}
