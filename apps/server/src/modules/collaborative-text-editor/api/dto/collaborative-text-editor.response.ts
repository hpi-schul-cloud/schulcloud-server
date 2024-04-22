import { ApiProperty } from '@nestjs/swagger';

export class CollaborativeTextEditorResponse {
	@ApiProperty()
	url: string;

	constructor(props: CollaborativeTextEditorResponse) {
		this.url = props.url;
	}
}
