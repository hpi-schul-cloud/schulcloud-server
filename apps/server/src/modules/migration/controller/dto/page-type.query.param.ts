import { IsMongoId } from 'class-validator';

export enum PageTypes {
	START_FROM_NEW_SYSTEM = 'start_from_new_system',
	START_FROM_OLD_SYSTEM = 'start_from_old_system',
	START_FROM_OLD_SYSTEM_MANDATORY = 'start_from_old_system_mandatory',
}

export class PageTypeQueryParams {
	pageType!: PageTypes;

	@IsMongoId()
	sourceSystem!: string;

	@IsMongoId()
	targetSystem!: string;
}
