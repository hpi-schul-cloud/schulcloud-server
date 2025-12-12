import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsString } from 'class-validator';
import { UserDeviceProps } from '../interface';

@ValueObject()
export class UserDevice implements UserDeviceProps {
	@IsString()
	public readonly deviceUserAgent: string;
	@IsString()
	public readonly browserName: string;
	@IsString()
	public readonly browserVersion: string;
	@IsString()
	public readonly os: string;

	constructor(props: UserDeviceProps) {
		this.deviceUserAgent = props.deviceUserAgent || '';
		this.browserName = props.browserName || '';
		this.browserVersion = props.browserVersion || '';
		this.os = props.os || '';
	}
}
