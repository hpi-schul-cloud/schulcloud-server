import { ApiProperty } from '@nestjs/swagger';

export class BoardImportProgressResponse {
	@ApiProperty({ description: 'The number of sections and cards that the import creates.' })
	total: number;

	@ApiProperty({ description: 'The number of sections and cards that the import has created.' })
	imported: number;

	constructor(props: BoardImportProgressResponse) {
		this.total = props.total;
		this.imported = props.imported;
	}
}
