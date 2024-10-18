import { CardResponseElementsInnerDto } from './card-response-elements-inner.dto';
import { TimestampResponseDto } from './timestamp-response.dto';
import { VisibilitySettingsResponseDto } from './visibility-settings-response.dto';

export class CardResponseDto {
	id: string;

	title?: string;

	height: number;

	elements: Array<CardResponseElementsInnerDto>;

	visibilitySettings: VisibilitySettingsResponseDto;

	timeStamps: TimestampResponseDto;

	constructor(
		id: string,
		title: string,
		height: number,
		elements: CardResponseElementsInnerDto[],
		visibilitySettings: VisibilitySettingsResponseDto,
		timeStamps: TimestampResponseDto
	) {
		this.id = id;
		this.title = title;
		this.height = height;
		this.elements = elements;
		this.visibilitySettings = visibilitySettings;
		this.timeStamps = timeStamps;
	}
}
