export default {
	rand: (from, to) => {
		return Math.random() * (to - from) + from;
	},
	randInt: (from, to) => {
		return Math.floor(Math.random() * (to - from) + from);
	},
	clamp: (value, min, max) => {
		return Math.min(Math.max(value, min), max);
	},
	rectContains(topLeft, bottomRight, point) {
		return (point.x >= topLeft.x
				&& point.x < bottomRight.x
				&& point.y >= topLeft.y
				&& point.y < bottomRight.y
		);
	}
};
