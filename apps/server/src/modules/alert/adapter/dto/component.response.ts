import { ComponentDto } from './component.dto';

export class ComponentResponse {
	constructor(data: ComponentDto) {
		this.data = data;
	}

	data: ComponentDto;
}
