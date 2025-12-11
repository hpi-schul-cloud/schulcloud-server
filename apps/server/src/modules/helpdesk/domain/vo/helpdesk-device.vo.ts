import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsString } from 'class-validator';
import { HelpdeskDeviceProps } from '../interface';

@ValueObject()
export class HelpdeskDevice implements HelpdeskDeviceProps {
	@IsString()
	public readonly deviceUserAgent: string;
	@IsString()
	public readonly browserName: string;
	@IsString()
	public readonly browserVersion: string;
	@IsString()
	public readonly os: string;

	constructor(props: HelpdeskDeviceProps) {
		this.deviceUserAgent = props.deviceUserAgent || '';
		this.browserName = props.browserName || '';
		this.browserVersion = props.browserVersion || '';
		this.os = props.os || '';
	}
}
