const { FileModel } = require('../model')
const { courseModel } = require('../../user-group/model')
const { teamsModel } = require('../../teams/model')

const updateParentDirectories = async (resourceID) => {
    const file = await FileModel.findById(resourceID).lean().exec()
    if (file) {
        let parentID = file.parent
        if (parentID || file.refOwnerModel === 'user') {
            await FileModel.update({ _id: parentID }, { updatedAt: new Date().toISOString() }).exec()
            await updateParentDirectories(parentID)
        } else {
            if (file.refOwnerModel === 'course') {
                await courseModel.update({ _id: file.owner }, { updatedAt: new Date().toISOString() }).exec()
            } else if (file.refOwnerModel === 'teams') {
                await teamsModel.update({ _id: file.owner }, { updatedAt: new Date().toISOString() }).exec()
            }
        }
    }
}

module.exports = updateParentDirectories;
