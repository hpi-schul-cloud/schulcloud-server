import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsOptional, IsString } from 'class-validator';
import { UserDeviceProps } from '../interface';

@ValueObject()
export class UserDevice implements UserDeviceProps {
	@IsString()
	@IsOptional()
	public readonly deviceUserAgent?: string;

	@IsString()
	@IsOptional()
	public readonly browserName?: string;

	@IsString()
	@IsOptional()
	public readonly browserVersion?: string;

	@IsString()
	@IsOptional()
	public readonly os?: string;

	constructor(props: UserDeviceProps) {
		this.deviceUserAgent = props.deviceUserAgent;
		this.browserName = props.browserName;
		this.browserVersion = props.browserVersion;
		this.os = props.os;
	}
}
