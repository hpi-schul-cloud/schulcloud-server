import { ApiProperty } from '@nestjs/swagger';
import { BoardImportJobStatus } from '../../domain';

export class BoardImportJobResponse {
	@ApiProperty({ description: 'The id of the import job.' })
	id: string;

	@ApiProperty({ enum: BoardImportJobStatus, enumName: 'BoardImportJobStatus' })
	status: BoardImportJobStatus;

	constructor(props: BoardImportJobResponse) {
		this.id = props.id;
		this.status = props.status;
	}
}
