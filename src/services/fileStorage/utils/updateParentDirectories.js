const { FileModel } = require('../model');
const { courseModel } = require('../../user-group/model');
const { teamsModel } = require('../../teams/model');

const updateParentDirectories = async (resourceID) => {
    const file = await FileModel.findById(resourceID).lean().exec();
    if (file) {
        const parentID = file.parent;
        if (parentID || file.refOwnerModel === 'user') {
            await FileModel.updateOne({ _id: parentID }, { updatedAt: new Date().toISOString() }).exec();
            await updateParentDirectories(parentID);
        } else if (file.refOwnerModel === 'course') {
            await courseModel.updateOne({ _id: file.owner }, { updatedAt: new Date().toISOString() }).exec();
        } else if (file.refOwnerModel === 'teams') {
            await teamsModel.updateOne({ _id: file.owner }, { updatedAt: new Date().toISOString() }).exec();
        }
    }
}

module.exports = updateParentDirectories;
