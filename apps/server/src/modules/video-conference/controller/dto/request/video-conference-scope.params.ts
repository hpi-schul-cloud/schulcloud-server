import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';
import { VideoConferenceScope } from '../../../domain';

export class VideoConferenceScopeParams {
	@ApiProperty({ nullable: false, required: true, enum: VideoConferenceScope, enumName: 'VideoConferenceScope' })
	@IsEnum(VideoConferenceScope)
	public scope!: VideoConferenceScope;

	@ApiProperty({ nullable: false, required: true })
	@IsMongoId()
	public scopeId!: string;
}
