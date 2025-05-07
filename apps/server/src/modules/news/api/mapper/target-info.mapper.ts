import { NewsTarget } from '../../domain';
import { TargetInfoResponse } from '../dto';

export class TargetInfoMapper {
	public static mapToResponse(target: NewsTarget): TargetInfoResponse {
		const dto = new TargetInfoResponse({ id: target.id, name: target.name });
		return dto;
	}
}
