import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { type BoardImportNote, BoardImportNoteType } from '../../domain';

@Embeddable()
export class BoardImportNoteEmbeddable {
	@Enum(() => BoardImportNoteType)
	type: BoardImportNoteType;

	@Property({ nullable: true })
	sectionTitle?: string;

	@Property({ nullable: true })
	cardTitle?: string;

	@Property({ nullable: true })
	elementType?: string;

	@Property({ nullable: true })
	elementKind?: string;

	constructor(props: BoardImportNote) {
		this.type = props.type;
		this.sectionTitle = props.sectionTitle;
		this.cardTitle = props.cardTitle;
		this.elementType = props.elementType;
		this.elementKind = props.elementKind;
	}
}
