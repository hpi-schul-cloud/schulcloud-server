import { type AnyBoardNode, type AnyMediaElement, isAnyMediaElement, type MediaLine } from '../../../domain';
import { TimestampsResponse } from '../../dto';
import { MediaLineResponse } from '../dto';
import { AnyMediaElementResponseFactory } from './any-media-element-response.factory';

export class MediaLineResponseMapper {
	public static mapToResponse(line: MediaLine): MediaLineResponse {
		const elements = line.children.filter((element): element is AnyMediaElement =>
			isAnyMediaElement(element as AnyBoardNode)
		);

		const lineResponse: MediaLineResponse = new MediaLineResponse({
			id: line.id,
			title: line.title,
			elements: AnyMediaElementResponseFactory.mapToResponse(elements),
			timestamps: new TimestampsResponse({
				lastUpdatedAt: line.updatedAt,
				createdAt: line.createdAt,
			}),
			backgroundColor: line.backgroundColor,
			collapsed: line.collapsed,
		});

		return lineResponse;
	}
}
