module.exports = (socket) => {

    socket.on('disconnect', function () {
        const {user, course} = socket.meta;
        delete course.users[user.id];
        course.desks[user.bucket][user.id].userConnected = false;
        course.broadcastUpdate('users', 'desks');
    });

    socket.on("ADD_MEDIA", (meta) => {
        const {user, course} = socket.meta;
        let medium = meta.medium;
        medium.id = ++course.lastId;
        medium.sender = user && user.name;
        
        course.desks[meta.deskType][meta.desk].media.push(medium);
        course.broadcastUpdate('desks');
    });

    socket.on("DELETE_MEDIA", (id) => {
        const {user, course} = socket.meta;
        Object.keys(course.desks).forEach((deskType) => {
            if(!course.desks[deskType]) return;
            Object.keys(course.desks[deskType]).forEach((desk) => {
                desk = course.desks[deskType][desk];
                if(desk.media) {
                    desk.media = desk.media.filter((medium) => medium.id !== id);
                }
            });
        });
        course.broadcastUpdate('desks');
    });

    socket.on("SET_BOARD_LAYOUT", (layout) => {
        const {user, course} = socket.meta;
        course.board.layout = layout.key;
        course.board.maxElements = layout.maxElements;
        course.board.media = Object.values(course.board.media)
                                .filter((media) => !!media)
                                .slice(0, layout.maxElements || 1)
                                .reduce((acc, media, i) => {
                                    acc[i] = media;
                                    return acc;
                                }, {});
        course.broadcastUpdate('board');
    });

    socket.on("SET_MEDIA_ON_BOARD", (media) => {
        const {user, course} = socket.meta;
        if(!media) return;
        if(media.slot === undefined) {
            for(let i = 0; i < course.board.maxElements; i++) {
                if(!course.board.media[i]) {
                    media.slot = i;
                    break;
                }
            }
        }
        if(media.slot === undefined) {
            media.slot = 0;
        }
        course.board.media[media.slot] = media.media;
        course.broadcastUpdate('board');
    });
};