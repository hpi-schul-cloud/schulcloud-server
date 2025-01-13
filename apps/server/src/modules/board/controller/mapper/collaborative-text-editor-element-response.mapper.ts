import { ContentElementType, CollaborativeTextEditorElement } from '../../domain';
import { TimestampsResponse } from '../dto';
import { CollaborativeTextEditorElementResponse } from '../dto/element/collaborative-text-editor-element.response';
import { BaseResponseMapper } from './base-mapper.interface';

export class CollaborativeTextEditorElementResponseMapper implements BaseResponseMapper {
	private static instance: CollaborativeTextEditorElementResponseMapper;

	public static getInstance(): CollaborativeTextEditorElementResponseMapper {
		if (!CollaborativeTextEditorElementResponseMapper.instance) {
			CollaborativeTextEditorElementResponseMapper.instance = new CollaborativeTextEditorElementResponseMapper();
		}

		return CollaborativeTextEditorElementResponseMapper.instance;
	}

	mapToResponse(element: CollaborativeTextEditorElement): CollaborativeTextEditorElementResponse {
		const result = new CollaborativeTextEditorElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.COLLABORATIVE_TEXT_EDITOR,
			content: {},
		});

		return result;
	}

	canMap(element: unknown): boolean {
		return element instanceof CollaborativeTextEditorElement;
	}
}
