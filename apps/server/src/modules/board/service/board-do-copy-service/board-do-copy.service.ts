import { CopyStatus } from '@modules/copy-helper';
import { Injectable } from '@nestjs/common';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { RecursiveCopyVisitor } from './recursive-copy.visitor';
import { SchoolSpecificFileCopyService } from './school-specific-file-copy.interface';
import { ContextExternalToolService } from '../../../tool/context-external-tool/service';

export type BoardDoCopyParams = {
	original: AnyBoardDo;
	fileCopyService: SchoolSpecificFileCopyService;
	contextExternalToolService: ContextExternalToolService;
};

@Injectable()
export class BoardDoCopyService {
	public async copy(params: BoardDoCopyParams): Promise<CopyStatus> {
		const visitor = new RecursiveCopyVisitor(params.fileCopyService, params.contextExternalToolService);

		const result = await visitor.copy(params.original);

		return result;
	}
}
