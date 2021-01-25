import {GroupType} from "../internal/group-type";

export class CallerClassModel {
    id: string;
    description: string;
    displayName: string;
    groupType: GroupType = GroupType.CLASS;
}
