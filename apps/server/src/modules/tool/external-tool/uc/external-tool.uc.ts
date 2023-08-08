import { Injectable } from '@nestjs/common';
import { EntityId, IFindOptions, Page, Permission, User } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { ExternalToolSearchQuery } from '../../common/interface';
import { ExternalTool, ExternalToolConfig } from '../domain';
import { ExternalToolLogo } from '../domain/external-tool-logo';
import { ExternalToolLogoNotFoundLoggableException } from '../loggable';
import { ExternalToolService, ExternalToolValidationService } from '../service';
import { ExternalToolCreate, ExternalToolUpdate } from './dto';

const contentTypeDetector: Record<string, string> = {
	ffd8: 'image/jpeg',
	'89504e47': 'image/png',
};

@Injectable()
export class ExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly authorizationService: AuthorizationService,
		private readonly toolValidationService: ExternalToolValidationService
	) {}

	async createExternalTool(userId: EntityId, externalToolCreate: ExternalToolCreate): Promise<ExternalTool> {
		const externalTool = new ExternalTool({ ...externalToolCreate });
		await this.addLogoToExternalToolIfExists(externalTool);

		await this.ensurePermission(userId, Permission.TOOL_ADMIN);
		await this.toolValidationService.validateCreate(externalTool);

		const tool: ExternalTool = await this.externalToolService.createExternalTool(externalTool);

		return tool;
	}

	private async addLogoToExternalToolIfExists(externalTool: Partial<ExternalTool>): Promise<Partial<ExternalTool>> {
		if (!externalTool.logoUrl) {
			return externalTool;
		}

		const base64Logo: string | null = await this.externalToolService.fetchBase64Logo(externalTool.logoUrl);
		if (base64Logo) {
			externalTool.logoBase64 = base64Logo;
		}

		return externalTool;
	}

	async updateExternalTool(userId: EntityId, toolId: string, externalTool: ExternalToolUpdate): Promise<ExternalTool> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		await this.addLogoToExternalToolIfExists(externalTool);

		await this.toolValidationService.validateUpdate(toolId, externalTool);

		const loaded: ExternalTool = await this.externalToolService.findExternalToolById(toolId);
		const configToUpdate: ExternalToolConfig = { ...loaded.config, ...externalTool.config };
		const toUpdate: ExternalTool = new ExternalTool({
			...loaded,
			...externalTool,
			config: configToUpdate,
			version: loaded.version,
		});

		const saved: ExternalTool = await this.externalToolService.updateExternalTool(toUpdate, loaded);

		return saved;
	}

	async findExternalTool(
		userId: EntityId,
		query: ExternalToolSearchQuery,
		options: IFindOptions<ExternalTool>
	): Promise<Page<ExternalTool>> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const tools: Page<ExternalTool> = await this.externalToolService.findExternalTools(query, options);
		return tools;
	}

	async getExternalTool(userId: EntityId, toolId: EntityId): Promise<ExternalTool> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const tool: ExternalTool = await this.externalToolService.findExternalToolById(toolId);
		return tool;
	}

	async deleteExternalTool(userId: EntityId, toolId: EntityId): Promise<void> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const promise: Promise<void> = this.externalToolService.deleteExternalTool(toolId);
		return promise;
	}

	private async ensurePermission(userId: EntityId, permission: Permission) {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [permission]);
	}

	async getExternalToolBinaryLogo(toolId: EntityId): Promise<ExternalToolLogo> {
		const tool: ExternalTool = await this.externalToolService.findExternalToolById(toolId);

		if (!tool.logoBase64) {
			throw new ExternalToolLogoNotFoundLoggableException(toolId);
		}

		const logoBinaryData: Buffer = Buffer.from(tool.logoBase64, 'base64');

		const externalToolLogoDto: ExternalToolLogo = new ExternalToolLogo({
			contentType: this.detectContentType(logoBinaryData),
			logo: logoBinaryData,
		});

		return externalToolLogoDto;
	}

	private detectContentType(imageBuffer: Buffer): string {
		const imageSignature: string = imageBuffer.toString('hex', 0, 3);

		const contentType: string = contentTypeDetector[imageSignature] || 'image/png';

		return contentType;
	}
}
