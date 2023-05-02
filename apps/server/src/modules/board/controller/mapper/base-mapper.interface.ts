import type { AnyBoardDo } from '@shared/domain';
import type { AnyContentElementResponse } from '../dto';

export interface BaseResponseMapper<T = AnyBoardDo> {
	mapToResponse(element: T): AnyContentElementResponse;

	canMap(element: T): boolean;
}
