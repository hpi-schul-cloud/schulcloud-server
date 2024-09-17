import type { AnyBoardNode } from '../../domain';
import type { AnyContentElementResponse } from '../dto';

export interface BaseResponseMapper<T = AnyBoardNode, U = AnyContentElementResponse> {
	mapToResponse(element: T): U;

	canMap(element: T): boolean;
}
