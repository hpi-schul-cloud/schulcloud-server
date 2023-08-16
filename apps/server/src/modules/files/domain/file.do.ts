import { EntityId } from '@shared/domain';

import { FileSecurityCheck } from './file-security-check.do';
import { FileOwnerModel } from './types';
import { FilePermission } from './file-permission.do';

export interface FileProps {
	id: EntityId;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
	deleted: boolean;
	isDirectory: boolean;
	name: string;
	size?: number;
	type?: string;
	storageFileName?: string;
	bucket?: string;
	storageProviderId?: EntityId;
	thumbnail?: string;
	thumbnailRequestToken?: string;
	securityCheck: FileSecurityCheck;
	shareTokens: string[];
	parentId?: EntityId;
	ownerId: EntityId;
	ownerModel: FileOwnerModel;
	creatorId: EntityId;
	permissions: FilePermission[];
	lockId?: EntityId;
}

export class File {
	protected props: FileProps;

	constructor(props: FileProps) {
		this.props = props;
	}

	get id(): EntityId {
		return this.props.id;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get deletedAt(): Date | undefined {
		return this.props.deletedAt;
	}

	get deleted(): boolean {
		return this.props.deleted;
	}

	get isDirectory(): boolean {
		return this.props.isDirectory;
	}

	get name(): string {
		return this.props.name;
	}

	get size(): number | undefined {
		return this.props.size;
	}

	get type(): string | undefined {
		return this.props.type;
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

	get thumbnail(): string | undefined {
		return this.props.thumbnail;
	}

	get thumbnailRequestToken(): string | undefined {
		return this.props.thumbnailRequestToken;
	}

	get securityCheck(): FileSecurityCheck {
		return this.props.securityCheck;
	}

	get shareTokens(): string[] {
		return this.props.shareTokens;
	}

	get parentId(): EntityId | undefined {
		return this.props.parentId;
	}

	get ownerId(): EntityId {
		return this.props.ownerId;
	}

	get ownerModel(): FileOwnerModel {
		return this.props.ownerModel;
	}

	get creatorId(): EntityId {
		return this.props.creatorId;
	}

	get permissions(): FilePermission[] {
		return this.props.permissions;
	}

	get lockId(): EntityId | undefined {
		return this.props.lockId;
	}
}
