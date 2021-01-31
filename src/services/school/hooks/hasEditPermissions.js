const { getUser } = require('../../../hooks');
const { SCHOOL_FEATURES } = require('../schools.model');
const { isTeamCreationByStudentsEnabled } = require('./common');
const { Forbidden } = require('../../../errors');

module.exports = async (context) => {
    try {
        const user = await getUser(context);
        if (user.permissions.includes('SCHOOL_EDIT')) {
            // SCHOOL_EDIT includes all of the more granular permissions below
            return context;
        }
        // if the user does not have SCHOOL_EDIT permissions, reduce the patch to the fields
        // the user is allowed to edit
        const patch = {};
        for (const key of Object.keys(context.data)) {
            if (
                    (user.permissions.includes('SCHOOL_CHAT_MANAGE') && updatesChat(key, context.data)) ||
                    (user.permissions.includes('SCHOOL_STUDENT_TEAM_MANAGE') && updatesTeamCreation(key, context.data)) ||
                    (user.permissions.includes('SCHOOL_LOGO_MANAGE') && key==='logo_dataUrl')
            ) {
                patch[key] = context.data[key];
            }
        }
        context.data = patch;
        return context;
    } catch (err) {
        logger.error('Failed to check school edit permissions', err);
        throw new Forbidden('You don\'t have the necessary permissions to patch these fields');
    }
};

const updatesChat = (key, data) => {
    const chatFeatures = [
        SCHOOL_FEATURES.ROCKET_CHAT,
        SCHOOL_FEATURES.MESSENGER,
        SCHOOL_FEATURES.MESSENGER_SCHOOL_ROOM,
        SCHOOL_FEATURES.VIDEOCONFERENCE,
        SCHOOL_FEATURES.MESSENGER_STUDENT_ROOM_CREATE,
    ];
    return updatesArray(key) && chatFeatures.indexOf(data[key].features)!== -1;
};

const updatesArray = (key) => key==='$push' || key==='$pull';

const updatesTeamCreation = (key, data) => updatesArray(key) && !isTeamCreationByStudentsEnabled(data[key]);

