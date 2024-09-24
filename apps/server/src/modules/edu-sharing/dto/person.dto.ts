import { UserProfileDto } from './user-profile.dto';

export interface PersonDto {
	firstName?: string;
	lastName?: string;
	mailbox?: string;
	profile?: UserProfileDto;
}
