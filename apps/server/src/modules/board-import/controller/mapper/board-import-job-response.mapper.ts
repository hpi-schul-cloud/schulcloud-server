import { type BoardImportJob } from '../../domain';
import { BoardImportJobResponse, BoardImportNoteResponse } from '../dto';

export class BoardImportJobResponseMapper {
	public static mapToResponse(job: BoardImportJob): BoardImportJobResponse {
		const response = new BoardImportJobResponse({
			id: job.id,
			status: job.status,
			failureReason: job.failureReason,
			notes: job.notes.map((note) => new BoardImportNoteResponse(note)),
		});

		return response;
	}
}
