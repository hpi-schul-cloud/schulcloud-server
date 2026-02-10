import { EntityId } from '@shared/domain/types';
import { SupportType } from '../type';

export interface HelpdeskProps {
	supportType: SupportType;
	subject: string;
	replyEmail: string;
	problemArea: string[];
	device?: string;
	consent?: boolean;
}
export interface HelpdeskProblemProps extends HelpdeskProps {
	problemDescription: string;
}

export interface HelpdeskWishProps extends HelpdeskProps {
	role: string;
	desire: string;
	benefit: string;
	acceptanceCriteria?: string;
}

export interface UserDeviceProps {
	deviceUserAgent?: string;
	browserName?: string;
	browserVersion?: string;
	os?: string;
}

export interface UserContextProps {
	userId: EntityId;
	userName: string;
	userEmail: string;
	userRoles: string[];
	schoolId: EntityId;
	schoolName: string;
	instanceName: string;
}
