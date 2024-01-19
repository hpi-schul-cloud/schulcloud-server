import { ApiProperty } from '@nestjs/swagger';
import { VideoConferenceScope } from '@shared/domain/interface';
import { IsEnum, IsMongoId } from 'class-validator';

export class VideoConferenceScopeParams {
	@ApiProperty({ nullable: false, required: true, enum: VideoConferenceScope, enumName: 'VideoConferenceScope' })
	@IsEnum(VideoConferenceScope)
	scope!: VideoConferenceScope;

	@ApiProperty({ nullable: false, required: true })
	@IsMongoId()
	scopeId!: string;
}
