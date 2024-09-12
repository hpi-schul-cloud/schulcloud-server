import { ContentElementType, DeletedElement } from '../../domain';
import { DeletedElementContent, DeletedElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class DeletedElementResponseMapper implements BaseResponseMapper<DeletedElement, DeletedElementResponse> {
	private static instance: DeletedElementResponseMapper;

	public static getInstance(): DeletedElementResponseMapper {
		if (!DeletedElementResponseMapper.instance) {
			DeletedElementResponseMapper.instance = new DeletedElementResponseMapper();
		}

		return DeletedElementResponseMapper.instance;
	}

	mapToResponse(element: DeletedElement): DeletedElementResponse {
		const result = new DeletedElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.DELETED,
			content: new DeletedElementContent({ title: element.title, deletedElementType: element.deletedElementType }),
		});

		return result;
	}

	canMap(element: unknown): boolean {
		return element instanceof DeletedElement;
	}
}
