import { type AnyBoardDo, isMediaLine, type MediaBoard, type MediaLine } from '@shared/domain/domainobject';
import { TimestampsResponse } from '../../dto';
import { MediaBoardResponse, MediaLineResponse } from '../dto';
import { MediaLineResponseMapper } from './media-line-response.mapper';

export class MediaBoardResponseMapper {
	static mapToResponse(board: MediaBoard): MediaBoardResponse {
		const lines: MediaLineResponse[] = board.children
			.filter((line: AnyBoardDo): line is MediaLine => isMediaLine(line))
			.map((line: MediaLine) => MediaLineResponseMapper.mapToResponse(line));

		const boardResponse: MediaBoardResponse = new MediaBoardResponse({
			id: board.id,
			lines,
			timestamps: new TimestampsResponse({
				lastUpdatedAt: board.updatedAt,
				createdAt: board.createdAt,
			}),
		});

		return boardResponse;
	}
}
