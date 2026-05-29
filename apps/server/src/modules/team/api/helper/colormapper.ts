import { RoomColor } from '@modules/room';

export const TEAM_TO_ROOM_COLOR_MAP: Record<string, RoomColor> = {
	// RED
	'#9a0007': RoomColor.RED,
	'#d32f2f': RoomColor.RED,
	'#ff6659': RoomColor.RED,

	// ORANGE
	'#bb4d00': RoomColor.ORANGE,
	'#f57c00': RoomColor.ORANGE,
	'#ffad42': RoomColor.ORANGE,

	// YELLOW
	'#c17900': RoomColor.YELLOW,
	'#f9a825': RoomColor.YELLOW,
	'#ffd95a': RoomColor.YELLOW,

	// OLIVE
	'#8c9900': RoomColor.OLIVE,
	'#c0ca33': RoomColor.OLIVE,
	'#b2ca70': RoomColor.OLIVE,

	// GREEN
	'#005005': RoomColor.GREEN,
	'#2e7d32': RoomColor.GREEN,
	'#60ad5e': RoomColor.GREEN,

	// TURQUOISE
	'#005662': RoomColor.TURQUOISE,
	'#00838f': RoomColor.TURQUOISE,
	'#4fb3bf': RoomColor.TURQUOISE,

	// BLUE
	'#004ba0': RoomColor.BLUE,
	'#1976d2': RoomColor.BLUE,

	// LIGHT BLUE
	'#6d9aff': RoomColor.LIGHT_BLUE,

	// PURPLE → BLUE
	'#002984': RoomColor.BLUE,
	'#3f51b5': RoomColor.BLUE,
	'#757de8': RoomColor.BLUE,

	// BLUE GREY
	'#29434e': RoomColor.BLUE_GREY,
	'#546e7a': RoomColor.BLUE_GREY,
	'#819ca9': RoomColor.BLUE_GREY,

	// BROWN
	'#4b2c20': RoomColor.BROWN,
	'#795548': RoomColor.BROWN,
	'#a98274': RoomColor.BROWN,
};

export const DEFAULT_ROOM_COLOR = RoomColor.BLUE_GREY;

export function mapTeamColorToRoomColor(teamColor: string): RoomColor {
	return TEAM_TO_ROOM_COLOR_MAP[teamColor] || DEFAULT_ROOM_COLOR;
}
