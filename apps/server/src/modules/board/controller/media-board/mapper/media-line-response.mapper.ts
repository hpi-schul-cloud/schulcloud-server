import { type AnyBoardNode, AnyMediaElement, MediaLine } from '../../../domain';
import { TimestampsResponse } from '../../dto';
import { MediaLineResponse } from '../dto';
import { isAnyMediaElement } from '../dto/any-media-element.response';
import { AnyMediaElementResponseFactory } from './any-media-element-response.factory';

export class MediaLineResponseMapper {
	static mapToResponse(line: MediaLine): MediaLineResponse {
		const elements = line.children.filter((element: AnyBoardNode): element is AnyMediaElement =>
			isAnyMediaElement(element)
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
