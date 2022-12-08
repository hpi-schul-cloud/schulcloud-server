import { ApiProperty } from '@nestjs/swagger';
import { TitleCardElement } from '@shared/domain/entity/cardElement.entity';

export class CardTitleElementResponse {
	constructor(props: TitleCardElement) {
		this.value = props.value;
	}

	@ApiProperty()
	value: string;
}
