import { CustomParameterScope, ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolService } from '@modules/tool/context-external-tool';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolLogoService, ExternalToolService } from '@modules/tool/external-tool/service';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import {
	MediaAvailableLine,
	MediaAvailableLineElement,
	MediaBoard,
	MediaExternalToolElement,
} from '../../domain/media-board';
import { MediaBoardService } from './media-board.service';

@Injectable()
export class MediaAvailableLineService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly externalToolLogoService: ExternalToolLogoService,
		private readonly mediaBoardService: MediaBoardService
	) {}

	public async getUnusedAvailableSchoolExternalTools(user: User, board: MediaBoard): Promise<SchoolExternalTool[]> {
		const schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools({
			schoolId: user.school?.id,
			isDeactivated: false,
		});

		const contextExternalToolsByBoard: ContextExternalTool[] = await this.getContextExternalToolsByBoard(board);

		const unusedSchoolExternalTools: SchoolExternalTool[] = schoolExternalTools.filter(
			(schoolExternalTool: SchoolExternalTool) => {
				const isUsedByBoard = contextExternalToolsByBoard.some((contextExternalTool: ContextExternalTool) =>
					this.isContextExternalToolUsedBySchoolExternalTool(contextExternalTool, schoolExternalTool)
				);

				return !isUsedByBoard;
			}
		);

		return unusedSchoolExternalTools;
	}

	public async getAvailableExternalToolsForSchool(schoolExternalTools: SchoolExternalTool[]): Promise<ExternalTool[]> {
		const externalToolIdsUsedBySchool: string[] = schoolExternalTools
			.map((schoolExternalTool: SchoolExternalTool) => schoolExternalTool.toolId)
			.filter((id: string | undefined): id is string => id !== undefined);

		const externalToolsUsedBySchool: Page<ExternalTool> = await this.externalToolService.findExternalTools({
			ids: externalToolIdsUsedBySchool,
		});

		const availableExternalTools: ExternalTool[] = externalToolsUsedBySchool.data
			.filter((tool: ExternalTool) => !tool.isDeactivated)
			.filter((tool: ExternalTool) => !tool.isHidden)
			.filter((tool: ExternalTool) => !this.hasCustomContextParameters(tool))
			.filter((tool: ExternalTool) => !this.restrictsToMediaBoardElementContext(tool))
			.sort((toolA: ExternalTool, toolB: ExternalTool) => this.sortByCreatedAtDesc(toolA, toolB));

		return availableExternalTools;
	}

	private hasCustomContextParameters(tool: ExternalTool): boolean {
		const hasCustomParams = tool.parameters
			? tool.parameters.some((param) => param.scope === CustomParameterScope.CONTEXT)
			: false;

		return hasCustomParams;
	}

	private restrictsToMediaBoardElementContext(tool: ExternalTool): boolean {
		if (!tool.restrictToContexts || tool.restrictToContexts.length === 0) {
			return false;
		}

		const restrictsToMediaBoard = tool.restrictToContexts.includes(ToolContextType.MEDIA_BOARD);

		return !restrictsToMediaBoard;
	}

	private isContextExternalToolUsedBySchoolExternalTool(
		contextExternalTool: ContextExternalTool,
		schoolExternalTool: SchoolExternalTool
	): boolean {
		const isUsed = contextExternalTool.schoolToolRef.schoolToolId === schoolExternalTool.id;

		return isUsed;
	}

	private async getContextExternalToolsByBoard(board: MediaBoard): Promise<ContextExternalTool[]> {
		const contextExternalTools: Promise<ContextExternalTool>[] = this.mediaBoardService
			.findMediaElements(board)
			.map((element: MediaExternalToolElement) =>
				this.contextExternalToolService.findByIdOrFail(element.contextExternalToolId)
			);

		const allContextExternalTools: ContextExternalTool[] = await Promise.all(contextExternalTools);

		return allContextExternalTools;
	}

	public matchTools(
		availableExternalTools: ExternalTool[],
		schoolExternalTools: SchoolExternalTool[]
	): [ExternalTool, SchoolExternalTool][] {
		const matchedTuples = availableExternalTools
			.map((externalTool: ExternalTool) => {
				const matchingSchoolExternalTool = schoolExternalTools.find(
					(schoolExternalTool: SchoolExternalTool) => schoolExternalTool.toolId === externalTool.id
				);
				return matchingSchoolExternalTool ? [externalTool, matchingSchoolExternalTool] : null;
			})
			.filter((tuple): tuple is [ExternalTool, SchoolExternalTool] => tuple !== null);

		return matchedTuples;
	}

	public createMediaAvailableLine(availableExternalTools: [ExternalTool, SchoolExternalTool][]): MediaAvailableLine {
		const lineElements: MediaAvailableLineElement[] = availableExternalTools.map(
			([externalTool, schoolExternalTool]: [ExternalTool, SchoolExternalTool]) =>
				this.createMediaAvailableLineElement(externalTool, schoolExternalTool)
		);

		const line: MediaAvailableLine = new MediaAvailableLine({ elements: lineElements });

		return line;
	}

	private createMediaAvailableLineElement(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool
	): MediaAvailableLineElement {
		const logoUrl: string | undefined = this.externalToolLogoService.buildLogoUrl(externalTool);

		const element: MediaAvailableLineElement = new MediaAvailableLineElement({
			schoolExternalToolId: schoolExternalTool.id ?? '',
			name: externalTool.name,
			description: externalTool.description,
			logoUrl,
		});

		return element;
	}

	private sortByCreatedAtDesc(toolA: ExternalTool, toolB: ExternalTool): number {
		const timeA: number = toolA.createdAt?.getTime() ?? 0;
		const timeB: number = toolB.createdAt?.getTime() ?? 0;

		return timeB - timeA;
	}
}
