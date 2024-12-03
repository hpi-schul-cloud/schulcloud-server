import { CardResponseElementsInnerDto } from '../types/card-response-elements-inner.type';
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
		height: number,
		elements: CardResponseElementsInnerDto[],
		visibilitySettings: VisibilitySettingsResponseDto,
		timestamps: TimestampResponseDto,
		title?: string
	) {
		this.id = id;
		this.title = title;
		this.height = height;
		this.elements = elements;
		this.visibilitySettings = visibilitySettings;
		this.timeStamps = timestamps;
	}
}
