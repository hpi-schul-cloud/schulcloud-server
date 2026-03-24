import { DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface FileProps {
	id: EntityId;
	name: string;
	isDirectory: boolean;
	parentId?: EntityId;
	storageFileName?: string;
	bucket?: string;
	storageProviderId?: EntityId;
}

export class FileDo extends DomainObject<FileProps> {
	get name(): string {
		return this.props.name;
	}

	get sanitizedName(): string {
		return this.sanitizePathSegment(this.props.name);
	}

	get isDirectory(): boolean {
		return this.props.isDirectory;
	}

	get parentId(): EntityId | undefined {
		return this.props.parentId;
	}

	get storageFileName(): string | undefined {
		return this.props.storageFileName;
	}

	get bucket(): string | undefined {
		return this.props.bucket;
	}

	get storageProviderId(): EntityId | undefined {
		return this.props.storageProviderId;
	}

	private sanitizePathSegment(name: string): string {
		// Replace any path separators with a safe character to prevent nested paths.
		let segment = name.replace(/[\/\\]+/g, '_');
		// Trim whitespace and neutralize pure traversal segments like "." or "..".
		segment = segment.trim();
		if (segment === '' || segment === '.' || segment === '..') {
			segment = '_';
		}

		return segment;
	}
}
