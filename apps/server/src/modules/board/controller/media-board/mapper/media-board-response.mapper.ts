import { isMediaLine, type AnyBoardNode, type MediaBoard, type MediaLine } from '../../../domain';
import { TimestampsResponse } from '../../dto';
import { MediaBoardResponse, type MediaLineResponse } from '../dto';
import { MediaLineResponseMapper } from './media-line-response.mapper';

export class MediaBoardResponseMapper {
	public static mapToResponse(board: MediaBoard): MediaBoardResponse {
		const lines: MediaLineResponse[] = board.children
			.filter((line): line is MediaLine => isMediaLine(line as AnyBoardNode))
			.map((line: MediaLine) => MediaLineResponseMapper.mapToResponse(line));

		const boardResponse: MediaBoardResponse = new MediaBoardResponse({
			id: board.id,
			lines,
			timestamps: new TimestampsResponse({
				lastUpdatedAt: board.updatedAt,
				createdAt: board.createdAt,
			}),
			layout: board.layout,
		});

		return boardResponse;
	}
}
