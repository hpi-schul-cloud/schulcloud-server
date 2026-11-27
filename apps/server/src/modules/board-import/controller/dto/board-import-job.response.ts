import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoardImportJobLogReason, BoardImportJobStatus } from '../../domain';
import { BoardImportNoteResponse } from './board-import-note.response';
import { BoardImportProgressResponse } from './board-import-progress.response';

export class BoardImportJobResponse {
	@ApiProperty({ description: 'The id of the import job.' })
	id: string;

	@ApiProperty({ enum: BoardImportJobStatus, enumName: 'BoardImportJobStatus' })
	status: BoardImportJobStatus;

	@ApiPropertyOptional({
		enum: BoardImportJobLogReason,
		enumName: 'BoardImportJobFailureReason',
		description: 'The reason why the job failed. Only a failed job has a reason.',
	})
	failureReason?: BoardImportJobLogReason;

	@ApiProperty({
		type: [BoardImportNoteResponse],
		description: 'The content of the source that the board does not contain as the source has it.',
	})
	notes: BoardImportNoteResponse[];

	@ApiPropertyOptional({
		type: BoardImportProgressResponse,
		description: 'The progress of the import. A job has no progress before the import has read the source.',
	})
	progress?: BoardImportProgressResponse;

	constructor(props: BoardImportJobResponse) {
		this.id = props.id;
		this.status = props.status;
		this.failureReason = props.failureReason;
		this.notes = props.notes;
		this.progress = props.progress;
	}
}
