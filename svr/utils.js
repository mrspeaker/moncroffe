"use strict";

var utils = {};
utils.dist = function (v1, v2) {

	var dx = v1.x - v2.x,
		dy = v1.y - v2.y,
		dz = v1.z - v2.z;

	return Math.sqrt(dx * dx + dy * dy + dz * dz);

};

module.exports = utils;