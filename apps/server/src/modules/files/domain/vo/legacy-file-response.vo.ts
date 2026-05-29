import { EntityId } from '@shared/domain/types';
import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';
import { LegacyFileResponse } from '../types';

@ValueObject()
export class LegacyFileResponseVo implements LegacyFileResponse {
	@IsMongoId()
	public readonly _id: EntityId;
	@IsString()
	public readonly name: string;
	@IsBoolean()
	public readonly isDirectory: boolean;
	@IsMongoId()
	@IsOptional()
	public readonly parent?: EntityId;
	@IsString()
	@IsOptional()
	public readonly storageFileName?: string;
	@IsString()
	@IsOptional()
	public readonly bucket?: string;
	@IsMongoId()
	@IsOptional()
	public readonly storageProviderId?: EntityId;

	constructor(props: LegacyFileResponse) {
		this._id = props._id;
		this.name = props.name;
		this.isDirectory = props.isDirectory;
		this.parent = props.parent;
		this.storageFileName = props.storageFileName;
		this.bucket = props.bucket;
		this.storageProviderId = props.storageProviderId;
	}
}
