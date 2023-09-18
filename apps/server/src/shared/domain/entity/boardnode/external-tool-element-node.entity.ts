import { Entity, ManyToOne } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { ContextExternalToolEntity } from '@src/modules/tool/context-external-tool/entity/context-external-tool.entity';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.EXTERNAL_TOOL })
export class ExternalToolElementNodeEntity extends BoardNode {
	@ManyToOne({ nullable: true })
	contextExternalTool?: ContextExternalToolEntity;

	constructor(props: ExternalToolElementNodeProps) {
		super(props);
		this.type = BoardNodeType.EXTERNAL_TOOL;
		this.contextExternalTool = props.contextExternalTool;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildExternalToolElement(this);
		return domainObject;
	}
}

export interface ExternalToolElementNodeProps extends BoardNodeProps {
	contextExternalTool?: ContextExternalToolEntity;
}
