import {Application} from "@feathersjs/express";
import {CallerClassModel, InternalClassModel, InternalUser, CallerUser} from "../model";
import {baseUrl} from "../../../environment";
import fetch, {Headers, RequestInit} from "node-fetch";
import {Request, Response} from "express";

import {GroupUtils} from "./util/GroupUtils";

export class GroupProxyService {

    constructor(private app: Application, private classesService: any, private userProxyService: any) {
        this.classesService = this.app.service('classes');
        this.userProxyService = this.app.service(`/syncapi/v1/users`);
    }

    async find() {
        const result = await this.classesService.find();
        const {data} = result;
        const groups = data.map(group => GroupProxyService.mapToCallerClassModel(group));
        return {value: [...groups]};
    }

    async get(groupId, params) {
        const result = await this.classesService.find({query: {_id: groupId}});
        const {data} = result;
        const [foundGroup] = data.map(group => GroupProxyService.mapToCallerClassModel(group));
        return foundGroup;
    }

    async create(model: CallerClassModel, params) {
        // TODO: tbd if find schoolId (required property), teacherIds, userIds is relevant for creating the class entity
        const groupClientModel = GroupProxyService.mapToInternalClassModel(model, this.getSchoolId())
        const createdGroup: InternalClassModel = await this.classesService.create(groupClientModel);
        return GroupProxyService.mapToCallerClassModel(createdGroup);
    }

    async patch(groupId, model: CallerClassModel, params) {
        // transform to persisted entity model
        // TODO: get schoolId
        const groupModel = GroupProxyService.mapToInternalClassModel(model, this.getSchoolId());
        // update
        const updatedGroup = await this.classesService.patch(groupId, groupModel);
        // transform updated entity to target model and return it
        return GroupProxyService.mapToCallerClassModel(updatedGroup);
    }

    /**
     * removes a group by provided groupId. a remove hooks exists to set the status code to 204
     */
    async remove(groupId, params) {
        // check if group exists
        const foundGroup = await this.get(groupId, params)
        if (foundGroup) return await this.classesService.remove(foundGroup.id);
    }

    async handleGetGroupMembers(req: Request, res: Response) {
        const {groupId} = req.params;
        const service = 'classes';
        const response = await fetch(`${baseUrl}/${service}/${groupId}`, GroupUtils.mapHeader(req, req.method));
        if (response.status === 200 && response.statusText.toLowerCase() === 'ok') {
            // extract the members
            const {userIds, teacherIds} = await response.json();
            // join the ids
            const memberIds = userIds.concat(teacherIds);
            // retrieve userdata for each id
            const members = await Promise.all(memberIds.map(async id => this.getMembersById(id, req)))
            res.send({value: members})
        } else {
            // response with the response from the classes service
            res.statusCode = response.status;
            res.statusMessage = response.statusText;
            res.send(await response.text())
        }
    }

    async getMembersById(id, req) {
        // fetch user details
        const result = await fetch(`${baseUrl}/users/${id}`, GroupUtils.mapHeader(req, req.method));
        const memberData: InternalUser = await result.json();
        // fetch account details
        const accountDetails = await this.app.service('accounts').find({query: {userId: memberData._id}});
        const isEnabled = accountDetails[0].activated !== undefined ? accountDetails[0].activated : false;
        // map to target user
        return this.userProxyService.mapCallerUserToInternalUser(memberData, memberData.email, isEnabled);
    }

    async handleDeleteGroupMember(req: Request, res: Response) {
        const {groupId, memberId} = req.params;
        const service = 'classes';
        const response = await fetch(`${baseUrl}/${service}/${groupId}`, GroupUtils.mapHeader(req, 'GET'));
        if (response.status === 200 && response.statusText.toLowerCase() === 'ok') {
            // extract the members
            const groupDetails = await response.json();
            const {userIds, teacherIds} = groupDetails;
            // remove the id provided by the params
            const filteredUserIds = userIds.filter(id => id !== memberId);
            const filteredTeacherIds = teacherIds.filter(id => id !== memberId);
            const updatedGroup = {
                ...groupDetails,
                userIds: filteredUserIds,
                teacherIds: filteredTeacherIds
            };
            await this.classesService.patch(groupDetails._id, updatedGroup)
            res.send(updatedGroup)
        } else {
            // response with the response from the classes service
            res.statusCode = response.status;
            res.statusMessage = response.statusText;
            res.send(await response.text())
        }
    }

    async handlePostGroupMember(req: Request, res: Response) {
        const {groupId} = req.params;
        //retrieve the userId from the body
        const paths = req.body['@odata.id'].split('/');
        const userId = paths[paths.length - 1];
        // check if user exists
        const foundUser = await this.app.service('/users').find({query: {_id: userId}});
        if (foundUser.data.length > 0) {
            // transform the user to target model
            const foundGroup = await this.classesService.get(groupId);
            const { userIds } : { userIds: string[] } = foundGroup;
            //FIXME Was ist, wenn der User schon in der Gruppe ist?
            const updatedUserIds = userIds.concat(foundUser.data[0].id);
            // created updated group with updated userIds
            const updatedGroup = {
                ...foundGroup,
                userIds: updatedUserIds
            }
            // update the group
            this.classesService.patch(groupId, updatedGroup)
        }
        res.send();
    }

    private getSchoolId() {
        return '5f2987e020834114b8efd6f8';
    }

    static mapToCallerClassModel(model: InternalClassModel): CallerClassModel {
        const callerClass: CallerClassModel = new CallerClassModel();
        callerClass.id = model.id;
        callerClass.description = model.description;
        callerClass.displayName = model.displayName;
        return callerClass;
    }


    static mapToInternalClassModel(model: CallerClassModel, schoolId: string) {
        const internalClass: InternalClassModel = new InternalClassModel();
        internalClass.id = model.id;
        internalClass.description = model.description;
        internalClass.displayName = model.displayName;
        internalClass.name = model.displayName;
        internalClass.schoolId = schoolId;
        return internalClass;
    }
}
