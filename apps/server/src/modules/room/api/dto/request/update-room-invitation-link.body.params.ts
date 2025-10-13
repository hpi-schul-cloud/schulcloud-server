import { RoomInvitationLinkDto } from '../../../domain/do/room-invitation-link.do';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { IsBoolean, IsDate, IsString, MaxLength, MinLength } from 'class-validator';

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
	public title!: string;

	@ApiPropertyOptional({
		description: 'Expiration date of the invitation link',
	})
	@IsDate()
	public activeUntil?: Date;

	@ApiPropertyOptional({
		description: 'Indicates if the link is also usable by external persons',
		required: false,
	})
	@IsBoolean()
	public isUsableByExternalPersons?: boolean;

	@ApiProperty({
		description: 'Indicates if the link is also usable by students',
		required: true,
	})
	@IsBoolean()
	public isUsableByStudents!: boolean;

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
