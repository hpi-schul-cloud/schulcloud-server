import { ContentElementType } from '@shared/domain';
import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import { DrawingElementResponse } from '@src/modules/board/controller/dto/element/drawing-element.response';
import { TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class DrawingElementResponseMapper implements BaseResponseMapper {
	private static instance: DrawingElementResponseMapper;

	public static getInstance(): DrawingElementResponseMapper {
		if (!DrawingElementResponseMapper.instance) {
			DrawingElementResponseMapper.instance = new DrawingElementResponseMapper();
		}

		return DrawingElementResponseMapper.instance;
	}

	mapToResponse(element: DrawingElement): DrawingElementResponse {
		const result = new DrawingElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.DRAWING,
			drawingName: element.drawingName,
		});

		return result;
	}

	canMap(element: DrawingElement): boolean {
		return element instanceof DrawingElement;
	}
}
