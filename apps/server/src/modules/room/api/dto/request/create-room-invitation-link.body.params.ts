import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { IsBoolean, IsDate, IsString, MaxLength, MinLength } from 'class-validator';
import { RoomInvitationLinkDto } from '../../../domain/do/room-invitation-link.do';

export class CreateRoomInvitationLinkBodyParams
	implements Omit<RoomInvitationLinkDto, 'creatorUserId' | 'creatorSchoolId'>
{
	@ApiProperty({
		description: 'Id of the room',
		required: true,
	})
	@IsString()
	public roomId!: string;

	@ApiProperty({
		description: 'Title of the link.',
	})
	@MinLength(1)
	@MaxLength(100)
	@SanitizeHtml()
	public title!: string;

	@ApiPropertyOptional({
		description: 'Expiration date of the invitation link',
		required: false,
		type: Date,
	})
	@IsDate()
	public activeUntil?: Date;

	@ApiProperty({
		description: 'Indicates if the link is restricted to teachers only',
		required: true,
	})
	@IsBoolean()
	public isOnlyForTeachers!: boolean;

	@ApiProperty({
		description: 'Indicates if the link is restricted to the creators school',
		required: true,
	})
	@IsBoolean()
	public restrictedToCreatorSchool!: boolean;

	@ApiProperty({
		description: 'Indicates if the link requires confirmation by room admins / room owners',
		required: true,
	})
	@IsBoolean()
	public requiresConfirmation!: boolean;
}
