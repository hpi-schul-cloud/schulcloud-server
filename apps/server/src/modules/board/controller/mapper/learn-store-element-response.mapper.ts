import { ContentElementType } from '@shared/domain';
import { LearnstoreElement } from '@shared/domain/domainobject/board/learnstore-element.do';
import { LearnstoreElementContent, LearnstoreElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class LearnStoreElementResponseMapper implements BaseResponseMapper {
	private static instance: LearnStoreElementResponseMapper;

	public static getInstance(): LearnStoreElementResponseMapper {
		if (!LearnStoreElementResponseMapper.instance) {
			LearnStoreElementResponseMapper.instance = new LearnStoreElementResponseMapper();
		}

		return LearnStoreElementResponseMapper.instance;
	}

	mapToResponse(element: LearnstoreElement): LearnstoreElementResponse {
		const result = new LearnstoreElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.LEARNSTORE,
			content: new LearnstoreElementContent({ someId: element.someId ?? null }),
		});

		return result;
	}

	canMap(element: LearnstoreElement): boolean {
		return element instanceof LearnstoreElement;
	}
}
