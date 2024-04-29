import { BoardNodeType, RichTextElementProps } from '../../domain';
import type {
	AnyBoardNodeProps,
	BoardNodeProps,
	CardProps,
	CollaborativeTextEditorProps,
	ColumnProps,
	ColumnBoardProps,
	LinkElementProps,
	FileElementProps,
	DrawingElementProps,
	SubmissionContainerElementProps,
	SubmissionItemProps,
	ExternalToolElementProps,
	MediaBoardProps,
	MediaExternalToolElementProps,
	MediaLineProps,
} from '../../domain';

// omit all given keys from an object type
type StrictOmit<T, K extends keyof T> = Omit<T, K>;

// make all value types of an object to be potentially undefined
// we cannot use Partial<> utility type because that makes the property keys optional
// and optional keys are not respected when implementing an interface like "class ... implements ..."
type MakeValuesPotentiallyUndefined<T> = {
	[P in keyof T]: T[P] | undefined;
};

// The properties that extend the base BoardNodeProps with specific BoardNodeType removed
type ExtraProps<T extends AnyBoardNodeProps> = StrictOmit<T, keyof BoardNodeProps>;

// We use Required<> utility type to make optional properties non-optional
type ComponentProps<T extends AnyBoardNodeProps> = MakeValuesPotentiallyUndefined<Required<ExtraProps<T>>>;

// re-add general BoardNodeType
type TypeProps = { type: BoardNodeType };

// The interface that acts as a skeleton for BoardNodeEntity
// This helps us to map the domain property interfaces to the entity
export interface BoardNodeEntityProps
	extends BoardNodeProps,
		TypeProps,
		ComponentProps<ColumnBoardProps>,
		ComponentProps<ColumnProps>,
		ComponentProps<CollaborativeTextEditorProps>,
		ComponentProps<CardProps>,
		ComponentProps<RichTextElementProps>,
		ComponentProps<LinkElementProps>,
		ComponentProps<FileElementProps>,
		ComponentProps<DrawingElementProps>,
		ComponentProps<SubmissionContainerElementProps>,
		ComponentProps<SubmissionItemProps>,
		ComponentProps<ExternalToolElementProps>,
		ComponentProps<MediaBoardProps>,
		ComponentProps<MediaExternalToolElementProps>,
		ComponentProps<MediaLineProps> {}
