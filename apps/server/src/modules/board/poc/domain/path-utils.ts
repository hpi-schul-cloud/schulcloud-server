import { EntityId } from '@shared/domain/types';
import { AnyBoardNodeProps } from './types';

export const PATH_SEPARATOR = ',';

export const ROOT_PATH = PATH_SEPARATOR;

export const joinPath = (path: string, id: EntityId): string => `${path}${id}${PATH_SEPARATOR}`;

export const pathOfChildren = (props: AnyBoardNodeProps): string => joinPath(props.path, props.id);
