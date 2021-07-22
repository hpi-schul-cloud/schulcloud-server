import { TargetInfoResponse } from '../controller/dto/target-info.response';
import { NewsTargetInfo } from '../entity';

export class TargetInfoMapper {
	static mapToResponse(target: NewsTargetInfo): TargetInfoResponse {
		const dto = new TargetInfoResponse();
		dto.id = target.id;
		dto.name = target.name;
		return dto;
	}
}
