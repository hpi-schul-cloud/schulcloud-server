import { type BoardImportJob } from '../../domain';
import { BoardImportJobResponse } from '../dto';

export class BoardImportJobResponseMapper {
	public static mapToResponse(job: BoardImportJob): BoardImportJobResponse {
		const response = new BoardImportJobResponse({
			id: job.id,
			status: job.status,
		});

		return response;
	}
}
