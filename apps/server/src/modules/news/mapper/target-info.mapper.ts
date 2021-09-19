import { NewsTargetInfo } from '@shared/domain/types/news.types';
import { TargetInfoResponse } from '../controller/dto/target-info.response';

export class TargetInfoMapper {
	static mapToResponse(target: NewsTargetInfo): TargetInfoResponse {
		const dto = new TargetInfoResponse();
		dto.id = target.id;
		dto.name = target.name;
		return dto;
	}
}
