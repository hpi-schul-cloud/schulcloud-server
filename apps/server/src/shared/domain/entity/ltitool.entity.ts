import { Entity, Enum, Property, Unique } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { BaseEntityWithTimestamps } from './base.entity';

export type ILtiToolProperties = Readonly<Omit<LtiTool, keyof BaseEntityWithTimestamps>>;

export enum LtiRoleType {
	LEARNER = 'Learner',
	INSTRUCTOR = 'Instructor',
	CONTENT_DEVELOPER = 'ContentDeveloper',
	ADMINISTRATOR = 'Administrator',
	MENTOR = 'Mentor',
	TEACHING_ASSISTANT = 'TeachingAssistant',
}

export enum LtiPrivacyPermission {
	ANONYMOUS = 'anonymous',
	EMAIL = 'e-mail',
	NAME = 'name',
	PUBLIC = 'public',
	PSEUDONYMOUS = 'pseudonymous',
}

export interface CustomLtiProperty {
	key: string;
	value: string;
}

@Entity({ tableName: 'ltitools' })
export class LtiTool extends BaseEntityWithTimestamps {
	@Property({ nullable: false })
	name: string;

	@Property({ nullable: false })
	url: string;

	@Property({ nullable: true })
	key: string;

	@Property({ nullable: false, default: 'none' })
	secret?: string;

	@Property({ nullable: true })
	logo_url?: string;

	@Property({ nullable: true })
	lti_message_type?: string;

	@Property({ nullable: true })
	lti_version?: string;

	@Property({ nullable: true })
	resource_link_id?: string;

	@Enum({ array: true, items: () => LtiRoleType })
	@Property({ nullable: false })
	roles?: LtiRoleType[];

	@Enum({
		items: () => LtiPrivacyPermission,
		default: LtiPrivacyPermission.ANONYMOUS,
		nullable: false,
	})
	privacy_permission?: LtiPrivacyPermission;

	@Property({ nullable: false })
	customs: CustomLtiProperty[];

	@Property({ nullable: true })
	isTemplate?: boolean;

	@Property({ nullable: true })
	isLocal?: boolean;

	@Property({ nullable: true, fieldName: 'originTool' })
	_originToolId?: ObjectId;

	@Property({ persist: false, getter: true })
	get originToolId(): EntityId | undefined {
		return this._originToolId?.toHexString();
	}

	@Property({ nullable: true })
	oAuthClientId?: string;

	@Property({ nullable: true })
	@Unique({ options: { sparse: true } })
	friendlyUrl?: string;

	@Property({ nullable: true })
	skipConsent?: boolean;

	@Property({ nullable: false, default: false })
	openNewTab?: boolean;

	@Property({ nullable: true })
	frontchannel_logout_uri?: string;

	@Property({ nullable: false, default: false })
	isHidden: boolean;

	constructor(props: ILtiToolProperties) {
		super();
		this.name = props.name;
		this.url = props.url;
		this.key = props.key;
		this.secret = props.secret;
		this.logo_url = props.logo_url;
		this.lti_message_type = props.lti_message_type;
		this.lti_version = props.lti_version;
		this.resource_link_id = props.resource_link_id;
		this.roles = props.roles || [];
		this.privacy_permission = props.privacy_permission || LtiPrivacyPermission.ANONYMOUS;
		this.customs = props.customs || [];
		this.isTemplate = props.isTemplate || false;
		this.isLocal = props.isLocal;
		if (props.originToolId !== undefined) {
			this._originToolId = new ObjectId(props.originToolId);
		}
		this.oAuthClientId = props.oAuthClientId;
		this.friendlyUrl = props.friendlyUrl;
		this.skipConsent = props.skipConsent;
		this.openNewTab = props.openNewTab || false;
		this.frontchannel_logout_uri = props.frontchannel_logout_uri;
		this.isHidden = props.isHidden;
	}
}
