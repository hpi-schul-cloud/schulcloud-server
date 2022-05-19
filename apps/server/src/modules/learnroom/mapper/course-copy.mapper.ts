import { CopyStatusDTO } from '@shared/domain';
import { CourseCopyApiResponse } from '../controller/dto/course-copy.response';

export class CourseCopyMapper {
	static mapToResponse(copyStatus: CopyStatusDTO): CourseCopyApiResponse {
		const dto = new CourseCopyApiResponse({
			title: copyStatus.title,
			type: copyStatus.type,
			status: copyStatus.status,
		});

		if (copyStatus.elements) {
			dto.elements = copyStatus.elements;
		}
		if (copyStatus.id) {
			dto.id = copyStatus.id;
		}
		return dto;
	}
}
