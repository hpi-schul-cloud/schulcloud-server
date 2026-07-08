import { EntityId } from '@shared/domain/types';

export const ROOT_PATH = ',';

export const joinPath = (path: string, id: EntityId): string => `${path}${id}${ROOT_PATH}`;

export const pathOfChildren = (props: { id: EntityId; path: string }): string => joinPath(props.path, props.id);
