import { NodeDto } from './node.dto';

export interface LtiSessionDto {
	acceptMultiple?: boolean;
	acceptPresentationDocumentTargets?: Array<string>;
	acceptTypes?: Array<string>;
	canConfirm?: boolean;
	customContentNode?: NodeDto;
	deeplinkReturnUrl?: string;
	text?: string;
	title?: string;
}
