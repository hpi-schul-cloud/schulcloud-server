const disconnect = socket => () => {
	const { user, course } = socket.meta;
	delete course.users[user.id];
	course.desks[user.bucket][user.id].userConnected = false;
	course.broadcastUpdate('users', 'desks');
};

const addMedia = socket => (meta) => {
	const { user, course } = socket.meta;
	const { medium } = meta;
	// eslint-disable-next-line no-plusplus
	medium.id = ++course.lastId;
	medium.sender = user && user.name;
	if (!course.desks[meta.deskType][meta.desk]) return;
	course.desks[meta.deskType][meta.desk].media.push(medium);
	course.broadcastUpdate('desks');
};

const deleteMedia = socket => (id) => {
	const { course } = socket.meta;
	Object.keys(course.desks).forEach((deskType) => {
		if (!course.desks[deskType]) return;
		Object.keys(course.desks[deskType]).forEach((desk) => {
			// eslint-disable-next-line no-param-reassign
			desk = course.desks[deskType][desk];
			if (desk.media) {
				desk.media = desk.media.filter(medium => medium.id !== id);
			}
		});
	});
	course.broadcastUpdate('desks');
};

const setBoardLayout = socket => ({ desk, deskType, key, maxElements }) => {
	const { course } = socket.meta;
	const deskObject = course.desks[deskType][desk];
	if (!deskObject) return;
	const { board } = deskObject;
	board.layout = key;
	board.maxElements = maxElements;
	board.media = Object.values(board.media)
		.filter(media => !!media)
		.slice(0, maxElements || 1)
		.reduce((acc, media, i) => {
			acc[i] = media;
			return acc;
		}, {});
	course.broadcastUpdate('desks');
};

const setMediaOnBoard = socket => ({
	desk, deskType, slot, media,
}) => {
	const { course } = socket.meta;
	const { board } = course.desks[deskType][desk];
	if (slot === undefined) {
		for (let i = 0; i < board.maxElements; i += 1) {
			if (!board.media[i]) {
				// eslint-disable-next-line no-param-reassign
				slot = i;
				break;
			}
		}
	}
	if (slot === undefined) {
		// eslint-disable-next-line no-param-reassign
		slot = 0;
	}
	board.media[slot] = media;
	course.broadcastUpdate('desks');
};

const createGroupDesk = socket => ({ name }) => {
	const { course } = socket.meta;
	course.desks.groups[name] = {
		media: [],
		board: {
			layout: '1x1',
			media: {},
		},
		name,
	};
	course.broadcastUpdate('desks');
};

module.exports = (socket) => {
	socket.on('disconnect', disconnect(socket));
	socket.on('ADD_MEDIA', addMedia(socket));
	socket.on('DELETE_MEDIA', deleteMedia(socket));
	socket.on('SET_BOARD_LAYOUT', setBoardLayout(socket));
	socket.on('SET_MEDIA_ON_BOARD', setMediaOnBoard(socket));
	socket.on('CREATE_GROUP_DESK', createGroupDesk(socket));
};
