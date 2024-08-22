import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ContextExternalToolRepo } from '@shared/repo';
import { CustomParameter, CustomParameterEntry } from '../../common/domain';
import { CommonToolDeleteService, CommonToolService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import {
	ContextExternalTool,
	ContextExternalToolLaunchable,
	ContextRef,
	RestrictedContextMismatchLoggableException,
} from '../domain';
import { ContextExternalToolQuery } from '../uc/dto/context-external-tool.types';

@Injectable()
export class ContextExternalToolService {
	constructor(
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly commonToolService: CommonToolService,
		private readonly commonToolDeleteService: CommonToolDeleteService
	) {}

	public async findContextExternalTools(query: ContextExternalToolQuery): Promise<ContextExternalTool[]> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find(query);

		return contextExternalTools;
	}

	public async findByIdOrFail(contextExternalToolId: EntityId): Promise<ContextExternalTool> {
		const tool: ContextExternalTool = await this.contextExternalToolRepo.findById(contextExternalToolId);

		return tool;
	}

	public async findById(contextExternalToolId: EntityId): Promise<ContextExternalTool | null> {
		const tool: ContextExternalTool | null = await this.contextExternalToolRepo.findByIdOrNull(contextExternalToolId);

		return tool;
	}

	public async saveContextExternalTool(contextExternalTool: ContextExternalTool): Promise<ContextExternalTool> {
		const savedContextExternalTool: ContextExternalTool = await this.contextExternalToolRepo.save(contextExternalTool);

		return savedContextExternalTool;
	}

	public async deleteContextExternalTool(contextExternalTool: ContextExternalTool): Promise<void> {
		await this.commonToolDeleteService.deleteContextExternalTool(contextExternalTool);
	}

	public async findAllByContext(contextRef: ContextRef): Promise<ContextExternalTool[]> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			context: contextRef,
		});

		return contextExternalTools;
	}

	public async checkContextRestrictions(contextExternalTool: ContextExternalToolLaunchable): Promise<void> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			contextExternalTool.schoolToolRef.schoolToolId
		);

		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		if (this.commonToolService.isContextRestricted(externalTool, contextExternalTool.contextRef.type)) {
			throw new RestrictedContextMismatchLoggableException(externalTool.name, contextExternalTool.contextRef.type);
		}
	}

	public async copyContextExternalTool(
		contextExternalTool: ContextExternalTool,
		contextCopyId: EntityId
	): Promise<ContextExternalTool> {
		const copy = new ContextExternalTool({
			...contextExternalTool.getProps(),
			id: new ObjectId().toHexString(),
		});

		copy.contextRef.id = contextCopyId;

		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			copy.schoolToolRef.schoolToolId
		);
		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		copy.parameters.forEach((parameter: CustomParameterEntry): void => {
			const isUnusedParameter = !externalTool.parameters?.find(
				(param: CustomParameter): boolean => param.name === parameter.name
			);
			if (isUnusedParameter) {
				this.deleteUnusedParameter(copy, parameter.name);
			}
		});

		externalTool.parameters?.forEach((parameter: CustomParameter): void => {
			if (parameter.isProtected) {
				this.deleteProtectedValues(copy, parameter.name);
			}
		});

		const copiedTool: ContextExternalTool = await this.contextExternalToolRepo.save(copy);

		return copiedTool;
	}

	private deleteUnusedParameter(contextExternalTool: ContextExternalTool, unusedParameterName: string): void {
		const unusedParameter: CustomParameterEntry | undefined = contextExternalTool.parameters.find(
			(param: CustomParameterEntry): boolean => param.name === unusedParameterName
		);

		if (unusedParameter) {
			const unusedParameterIndex: number = contextExternalTool.parameters.indexOf({
				name: unusedParameter.name,
				value: unusedParameter.value,
			});
			contextExternalTool.parameters.splice(unusedParameterIndex, 1);
		}
	}

	private deleteProtectedValues(contextExternalTool: ContextExternalTool, protectedParameterName: string): void {
		const protectedParameter: CustomParameterEntry | undefined = contextExternalTool.parameters.find(
			(param: CustomParameterEntry): boolean => param.name === protectedParameterName
		);

		if (protectedParameter) {
			protectedParameter.value = undefined;
		}
	}
}
