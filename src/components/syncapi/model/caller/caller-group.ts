import {GroupType} from "../internal/group-type";

export interface CallerGroup {
    id: string;
    description: string;
    displayName: string;
    groupType: GroupType;
}
