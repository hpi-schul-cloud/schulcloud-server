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

	constructor(props: Readonly<CardResponseDto>) {
		this.id = props.id;
		this.title = props.title;
		this.height = props.height;
		this.elements = props.elements;
		this.visibilitySettings = props.visibilitySettings;
		this.timeStamps = props.timeStamps;
	}
}
