import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoardImportNoteType } from '../../domain';

export class BoardImportNoteResponse {
	@ApiProperty({ enum: BoardImportNoteType, enumName: 'BoardImportNoteType' })
	type: BoardImportNoteType;

	@ApiPropertyOptional({ description: 'The title of the section in the source.' })
	sectionTitle?: string;

	@ApiPropertyOptional({ description: 'The title of the card in the source.' })
	cardTitle?: string;

	@ApiPropertyOptional({ description: 'The type of the element in the source, for example link or file.' })
	elementType?: string;

	@ApiPropertyOptional({ description: 'The kind of an element that the import has no type for.' })
	elementKind?: string;

	constructor(props: BoardImportNoteResponse) {
		this.type = props.type;
		this.sectionTitle = props.sectionTitle;
		this.cardTitle = props.cardTitle;
		this.elementType = props.elementType;
		this.elementKind = props.elementKind;
	}
}
