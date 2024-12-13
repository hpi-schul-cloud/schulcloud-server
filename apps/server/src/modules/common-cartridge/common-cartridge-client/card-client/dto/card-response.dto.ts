import { CardResponseElementsInnerDto } from '../types/card-response-elements-inner.type';
import { TimestampResponseDto } from './timestamp-response.dto';
import { VisibilitySettingsResponseDto } from './visibility-settings-response.dto';

export class CardResponseDto {
	public id: string;

	public title?: string;

	public height: number;

	public elements: Array<CardResponseElementsInnerDto>;

	public visibilitySettings: VisibilitySettingsResponseDto;

	public timeStamps: TimestampResponseDto;

	constructor(props: Readonly<CardResponseDto>) {
		this.id = props.id;
		this.title = props.title;
		this.height = props.height;
		this.elements = props.elements;
		this.visibilitySettings = props.visibilitySettings;
		this.timeStamps = props.timeStamps;
	}
}
