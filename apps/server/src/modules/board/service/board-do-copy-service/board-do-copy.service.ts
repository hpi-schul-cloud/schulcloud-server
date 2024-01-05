import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { CopyStatus } from '@modules/copy-helper';
import { Inject, Injectable } from '@nestjs/common';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { IToolFeatures, ToolFeatures } from '@modules/tool/tool-config';
import { RecursiveCopyVisitor } from './recursive-copy.visitor';
import { SchoolSpecificFileCopyService } from './school-specific-file-copy.interface';

export type BoardDoCopyParams = {
	original: AnyBoardDo;
	fileCopyService: SchoolSpecificFileCopyService;
};

@Injectable()
export class BoardDoCopyService {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures
	) {}

	public async copy(params: BoardDoCopyParams): Promise<CopyStatus> {
		const visitor = new RecursiveCopyVisitor(
			params.fileCopyService,
			this.contextExternalToolService,
			this.toolFeatures
		);

		const result = await visitor.copy(params.original);

		return result;
	}
}
