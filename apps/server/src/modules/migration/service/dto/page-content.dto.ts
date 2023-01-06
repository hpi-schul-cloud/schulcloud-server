import { CancelKeys, ContentKeys } from '../../interface/keys.enum';

export class PageContentDto {
	contentKey?: ContentKeys;

	proceedButtonUrl?: string;

	cancelButtonKey?: CancelKeys;

	cancelButtonUrl?: string;
}
