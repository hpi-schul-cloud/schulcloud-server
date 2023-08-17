import { EntityId } from '@shared/domain';

import { FilePermissionReferenceModel } from './types';

export interface FilePermissionProps {
	referenceId: EntityId;
	referenceModel: FilePermissionReferenceModel;
	readPermission: boolean;
	writePermission: boolean;
	createPermission: boolean;
	deletePermission: boolean;
}

export class FilePermission {
	protected props: FilePermissionProps;

	constructor(props: FilePermissionProps) {
		this.props = props;
	}

	public getProps(): FilePermissionProps {
		return { ...this.props };
	}

	get referenceId(): EntityId {
		return this.props.referenceId;
	}

	get referenceModel(): FilePermissionReferenceModel {
		return this.props.referenceModel;
	}

	get readPermission(): boolean {
		return this.props.readPermission;
	}

	get writePermission(): boolean {
		return this.props.writePermission;
	}

	get createPermission(): boolean {
		return this.props.createPermission;
	}

	get deletePermission(): boolean {
		return this.props.deletePermission;
	}
}
