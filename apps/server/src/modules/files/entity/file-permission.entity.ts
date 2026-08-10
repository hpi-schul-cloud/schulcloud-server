import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { FilePermissionReferenceModel } from '../domain';

export interface FilePermissionEntityProps {
	refId: EntityId;
	refPermModel: FilePermissionReferenceModel;
	write?: boolean;
	read?: boolean;
	create?: boolean;
	delete?: boolean;
}

@Embeddable()
export class FilePermissionEntity {
	@Property({ nullable: false })
	refId: ObjectId;

	@Enum({ nullable: false })
	refPermModel: FilePermissionReferenceModel;

	@Property({ type: 'boolean' })
	write = true;

	@Property({ type: 'boolean' })
	read = true;

	@Property({ type: 'boolean' })
	create = true;

	@Property({ type: 'boolean' })
	delete = true;

	constructor(props: FilePermissionEntityProps) {
		this.refId = new ObjectId(props.refId);
		this.refPermModel = props.refPermModel;

		if (props.write !== undefined) {
			this.write = props.write;
		}

		if (props.read !== undefined) {
			this.read = props.read;
		}

		if (props.create !== undefined) {
			this.create = props.create;
		}

		if (props.delete !== undefined) {
			this.delete = props.delete;
		}
	}
}
