module.exports = (socket) => {
	socket.on('disconnect', () => {
		const { user, course } = socket.meta;
		delete course.users[user.id];
		course.desks[user.bucket][user.id].userConnected = false;
		course.broadcastUpdate('users', 'desks');
	});

	socket.on('ADD_MEDIA', (meta) => {
		const { user, course } = socket.meta;
		const { medium } = meta;
		medium.id = ++course.lastId;
		medium.sender = user && user.name;
		if (!course.desks[meta.deskType][meta.desk]) return;
		course.desks[meta.deskType][meta.desk].media.push(medium);
		course.broadcastUpdate('desks');
	});

	socket.on('DELETE_MEDIA', (id) => {
		const { user, course } = socket.meta;
		Object.keys(course.desks).forEach((deskType) => {
			if (!course.desks[deskType]) return;
			Object.keys(course.desks[deskType]).forEach((desk) => {
				desk = course.desks[deskType][desk];
				if (desk.media) {
					desk.media = desk.media.filter(medium => medium.id !== id);
				}
			});
		});
		course.broadcastUpdate('desks');
	});

	socket.on('SET_BOARD_LAYOUT', ({
		desk, deskType, key, maxElements,
	}) => {
		const { user, course } = socket.meta;
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
	});

	socket.on('SET_MEDIA_ON_BOARD', ({
		desk, deskType, slot, media,
	}) => {
		const { user, course } = socket.meta;
		const { board } = course.desks[deskType][desk];
		if (slot === undefined) {
			for (let i = 0; i < board.maxElements; i++) {
				if (!board.media[i]) {
					slot = i;
					break;
				}
			}
		}
		if (slot === undefined) {
			slot = 0;
		}
		board.media[slot] = media;
		course.broadcastUpdate('desks');
	});

	socket.on('CREATE_GROUP_DESK', ({ name }) => {
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
	});
};
