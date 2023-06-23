import { VideoConferenceScope } from '@shared/domain';
import { IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VideoConferenceScopeParams {
	@ApiProperty({ nullable: false, required: true, enum: VideoConferenceScope, enumName: 'VideoConferenceScope' })
	@IsEnum(VideoConferenceScope)
	scope!: VideoConferenceScope;

	@ApiProperty({ nullable: false, required: true })
	@IsMongoId()
	scopeId!: string;
}
