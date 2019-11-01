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
	},
	removeAllEventListeners(node, type) {
		if (node instanceof Window) {
			if (typeof type === 'string') {
				node['on' + type] = null;
			} else {
				for(let prop in node) {
					if (prop.startsWith("on")) {
							node[prop] = null;
					}
				}
			}
		} else {
  		let nodeClone = node.cloneNode(true);
			node.parentNode.replaceChild(nodeClone, node);
		}
	}
};
