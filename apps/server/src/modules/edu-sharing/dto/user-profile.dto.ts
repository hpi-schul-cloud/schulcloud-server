export interface UserProfileDto {
	about?: string;
	avatar?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	primaryAffiliation?: string;
	skills?: Array<string>;
	type?: Array<string>;
	types?: Array<string>;
	vcard?: string;
}
