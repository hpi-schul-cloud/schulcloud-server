import type { AnyBoardNode } from '../../domain';
import type { AnyContentElementResponse } from '../dto';

export interface BaseResponseMapper<T = AnyBoardNode> {
	mapToResponse(element: T): AnyContentElementResponse;

	canMap(element: T): boolean;
}
