import { ContentElementType, MapElement } from '../../domain';
import { TimestampsResponse } from '../dto';
import { MapElementContent, MapElementResponse } from '../dto/element/map-element.response';
import { BaseResponseMapper } from './base-mapper.interface';

export class MapElementResponseMapper implements BaseResponseMapper {
	private static instance: MapElementResponseMapper;

	public static getInstance(): MapElementResponseMapper {
		if (!MapElementResponseMapper.instance) {
			MapElementResponseMapper.instance = new MapElementResponseMapper();
		}

		return MapElementResponseMapper.instance;
	}

	mapToResponse(element: MapElement): MapElementResponse {
		const result = new MapElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.MAP,
			content: new MapElementContent({
				centerLat: element.centerLat,
				centerLng: element.centerLng,
				zoom: element.zoom,
				features: element.features,
			}),
		});

		return result;
	}

	canMap(element: unknown): boolean {
		return element instanceof MapElement;
	}
}
