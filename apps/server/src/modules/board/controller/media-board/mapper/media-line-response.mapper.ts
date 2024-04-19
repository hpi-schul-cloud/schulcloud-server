import {
	type AnyBoardDo,
	isMediaExternalToolElement,
	MediaExternalToolElement,
	MediaLine,
} from '@shared/domain/domainobject';
import { TimestampsResponse } from '../../dto';
import { type MediaExternalToolElementResponse, MediaLineResponse } from '../dto';
import { MediaExternalToolElementResponseMapper } from './media-external-tool-element-response.mapper';

export class MediaLineResponseMapper {
	static mapToResponse(line: MediaLine): MediaLineResponse {
		const elements: MediaExternalToolElementResponse[] = line.children
			.filter((element: AnyBoardDo): element is MediaExternalToolElement => isMediaExternalToolElement(element))
			.map((element: MediaExternalToolElement) => MediaExternalToolElementResponseMapper.mapToResponse(element));

		const lineResponse: MediaLineResponse = new MediaLineResponse({
			id: line.id,
			title: line.title,
			elements,
			timestamps: new TimestampsResponse({
				lastUpdatedAt: line.updatedAt,
				createdAt: line.createdAt,
			}),
		});

		return lineResponse;
	}
}
