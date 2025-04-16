import { RoomInvitationLinkDto } from '../../../domain/do/room-invitation-link.do';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { IsBoolean, IsDate, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateRoomInvitationLinkBodyParams
	implements Omit<RoomInvitationLinkDto, 'roomId' | 'creatorUserId' | 'creatorSchoolId'>
{
	@ApiProperty({
		description: 'Title of the link.',
	})
	@MinLength(1)
	@MaxLength(100)
	@SanitizeHtml()
	@IsString()
	title!: string;

	@ApiPropertyOptional({
		description: 'Expiration date of the invitation link',
	})
	@IsOptional()
	@IsDate()
	activeUntil?: Date;

	@ApiPropertyOptional({
		description: 'Indicates if the link is restricted to teachers only',
		required: true,
	})
	@IsBoolean()
	isOnlyForTeachers!: boolean;

	@ApiPropertyOptional({
		description: 'Indicates if the link is restricted to the creators school',
		required: true,
	})
	@IsBoolean()
	restrictedToCreatorSchool!: boolean;

	@ApiProperty({
		description: 'Indicates if the link requires confirmation by room admins / room owners',
		required: true,
	})
	@IsBoolean()
	requiresConfirmation!: boolean;
}
