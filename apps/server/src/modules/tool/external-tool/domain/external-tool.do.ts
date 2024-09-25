import { InternalServerErrorException } from '@nestjs/common';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { CustomParameter } from '../../common/domain';
import { ToolConfigType, ToolContextType } from '../../common/enum';
import { BasicToolConfig, ExternalToolConfig, Lti11ToolConfig, Oauth2ToolConfig } from './config';
import { ExternalToolMedium } from './external-tool-medium.do';
import { FileRecordRef } from './file-record-ref';

export interface ExternalToolProps extends AuthorizableObject {
	id: string;

	name: string;

	description?: string;

	url?: string;

	logoUrl?: string;

	logo?: string;

	thumbnail?: FileRecordRef;

	config: BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig;

	parameters?: CustomParameter[];

	isHidden: boolean;

	isDeactivated: boolean;

	openNewTab: boolean;

	restrictToContexts?: ToolContextType[];

	medium?: ExternalToolMedium;

	createdAt?: Date;

	isPreferred: boolean;

	iconName?: string;
}

export class ExternalTool extends DomainObject<ExternalToolProps> {
	get name(): string {
		return this.props.name;
	}

	set name(value: string) {
		this.props.name = value;
	}

	get description(): string | undefined {
		return this.props.description;
	}

	set description(value: string | undefined) {
		this.props.description = value;
	}

	get url(): string | undefined {
		return this.props.url;
	}

	set url(value: string | undefined) {
		this.props.url = value;
	}

	get logoUrl(): string | undefined {
		return this.props.logoUrl;
	}

	set logoUrl(value: string | undefined) {
		this.props.logoUrl = value;
	}

	get logo(): string | undefined {
		return this.props.logo;
	}

	set logo(value: string | undefined) {
		this.props.logo = value;
	}

	get thumbnail(): FileRecordRef | undefined {
		return this.props.thumbnail;
	}

	set thumbnail(value: FileRecordRef | undefined) {
		this.props.thumbnail = value;
	}

	get config(): BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig {
		return this.props.config;
	}

	set config(value: BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig) {
		this.props.config = value;
	}

	get parameters(): CustomParameter[] | undefined {
		return this.props.parameters;
	}

	set parameters(value: CustomParameter[] | undefined) {
		this.props.parameters = value;
	}

	get isHidden(): boolean {
		return this.props.isHidden;
	}

	set isHidden(value: boolean) {
		this.props.isHidden = value;
	}

	get isDeactivated(): boolean {
		return this.props.isDeactivated;
	}

	set isDeactivated(value: boolean) {
		this.props.isDeactivated = value;
	}

	get openNewTab(): boolean {
		return this.props.openNewTab;
	}

	set openNewTab(value: boolean) {
		this.props.openNewTab = value;
	}

	get restrictToContexts(): ToolContextType[] | undefined {
		return this.props.restrictToContexts;
	}

	set restrictToContexts(value: ToolContextType[] | undefined) {
		this.props.restrictToContexts = value;
	}

	get medium(): ExternalToolMedium | undefined {
		return this.props.medium;
	}

	set medium(value: ExternalToolMedium | undefined) {
		this.props.medium = value;
	}

	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	set createdAt(value: Date | undefined) {
		this.props.createdAt = value;
	}

	get isPreferred(): boolean {
		return this.props.isPreferred;
	}

	set isPreferred(value: boolean) {
		this.props.isPreferred = value;
	}

	get iconName(): string | undefined {
		return this.props.iconName;
	}

	set iconName(value: string | undefined) {
		this.props.iconName = value;
	}

	public static readonly thumbnailNameAffix = 'thumbnail';

	constructor(props: ExternalToolProps) {
		super(props);

		this.name = props.name;
		this.description = props.description;
		this.url = props.url;
		this.logoUrl = props.logoUrl;
		this.logo = props.logo;
		if (ExternalTool.isBasicConfig(props.config)) {
			this.config = new BasicToolConfig(props.config);
		} else if (ExternalTool.isOauth2Config(props.config)) {
			this.config = new Oauth2ToolConfig(props.config);
		} else if (ExternalTool.isLti11Config(props.config)) {
			this.config = new Lti11ToolConfig(props.config);
		} else {
			throw new InternalServerErrorException(`Unknown tool config`);
		}
		this.parameters = props.parameters;
		this.isHidden = props.isHidden;
		this.isDeactivated = props.isDeactivated;
		this.openNewTab = props.openNewTab;
		this.restrictToContexts = props.restrictToContexts;
		this.medium = props.medium;
		this.createdAt = props.createdAt;
		this.isPreferred = props.isPreferred;
		this.iconName = props.iconName;
	}

	static isBasicConfig(config: ExternalToolConfig): config is BasicToolConfig {
		return ToolConfigType.BASIC === config.type;
	}

	static isOauth2Config(config: ExternalToolConfig): config is Oauth2ToolConfig {
		return ToolConfigType.OAUTH2 === config.type;
	}

	static isLti11Config(config: ExternalToolConfig): config is Lti11ToolConfig {
		return ToolConfigType.LTI11 === config.type;
	}
}
