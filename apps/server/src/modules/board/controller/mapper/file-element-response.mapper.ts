import { FileElement } from '@shared/domain';
import { ContentElementType } from '../../types/content-elements.enum';
import { FileElementContent, FileElementResponse, TimestampsResponse } from '../dto';

export class FileElementResponseMapper {
	static mapToResponse(element: FileElement): FileElementResponse {
		const result = new FileElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.FILE,
			content: new FileElementContent({ description: element.description }),
		});

		return result;
	}
}
