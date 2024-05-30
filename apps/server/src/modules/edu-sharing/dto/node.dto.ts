import { CollectionDto } from './collection.dto';
import { ContentDto } from './content.dto';
import { ContributorDto } from './contributor.dto';
import { LicenseDto } from './license.dto';
import { NodeLtiDeepLinkDto } from './node-lti-deep-link.dto';
import { NodeRefDto } from './node-ref.dto';
import { PersonDto } from './person.dto';
import { PreviewDto } from './preview.dto';
import { RatingDetailsDto } from './rating-details.dto';
import { RemoteDto } from './remote.dto';

export interface NodeDto {
	access: Array<string>;
	aspects?: Array<string>;
	collection: CollectionDto;
	commentCount?: number;
	content?: ContentDto;
	contributors?: Array<ContributorDto>;
	createdAt: string;
	createdBy: PersonDto;
	downloadUrl: string;
	iconURL?: string;
	isDirectory?: boolean;
	isPublic?: boolean;
	license?: LicenseDto;
	mediatype?: string;
	metadataset?: string;
	mimetype?: string;
	modifiedAt?: string;
	modifiedBy?: PersonDto;
	name: string;
	nodeLTIDeepLink?: NodeLtiDeepLinkDto;
	owner: PersonDto;
	parent?: NodeRefDto;
	preview?: PreviewDto;
	properties?: {
		[key: string]: Array<string>;
	};
	rating?: RatingDetailsDto;
	ref: NodeRefDto;
	relations?: {
		[key: string]: NodeDto;
	};
	remote?: RemoteDto;
	repositoryType?: string;
	size?: string;
	title?: string;
	type?: string;
	usedInCollections?: Array<NodeDto>;
}
