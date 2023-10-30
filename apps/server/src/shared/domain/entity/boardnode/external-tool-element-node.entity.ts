import { Entity, ManyToOne } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject/board/types/any-board-do';
import { ContextExternalToolEntity } from '@src/modules/tool/context-external-tool/entity/context-external-tool.entity';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder } from './types/board-do.builder';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.EXTERNAL_TOOL })
export class ExternalToolElementNodeEntity extends BoardNode {
	@ManyToOne({ nullable: true })
	contextExternalTool?: ContextExternalToolEntity;

	constructor(props: ExternalToolElementNodeEntityProps) {
		super(props);
		this.type = BoardNodeType.EXTERNAL_TOOL;
		this.contextExternalTool = props.contextExternalTool;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildExternalToolElement(this);
		return domainObject;
	}
}

export interface ExternalToolElementNodeEntityProps extends BoardNodeProps {
	contextExternalTool?: ContextExternalToolEntity;
}
