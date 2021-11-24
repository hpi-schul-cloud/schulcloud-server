import { NewsTarget } from '@shared/domain';
import { TargetInfoResponse } from '../controller/dto/target-info.response';

export class TargetInfoMapper {
	static mapToResponse(target: NewsTarget): TargetInfoResponse {
		const dto = new TargetInfoResponse({ id: target.id, name: target.name });
		return dto;
	}
}
