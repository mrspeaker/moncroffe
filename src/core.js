(function () {

	"use strict";

	var core = {},
		utils = {};

	utils.formatTime = function (sec) {

		var mins = Math.floor(sec / 60),
			secs = sec - (mins * 60);

		return mins + ":" + (secs < 10 ? "0" : "") + secs;

	};

	utils.rnd = {

		seed: 42,

		rand: function(max, min) {

			max = max || 1;
			min = min || 0;

			this.seed = (this.seed * 9301 + 49297) % 233280;

			return ((this.seed / 233280) * (max - min) + min) | 0;
		},

		randf: function() {

			this.seed = (this.seed * 9301 + 49297) % 233280;

			return this.seed / 233280;

		}

	};

	utils.dist = function (v1, v2) {

    	var dx = v1.x - v2.x,
    		dy = v1.y - v2.y,
    		dz = v1.z - v2.z;

    	return Math.sqrt(dx * dx + dy * dy + dz * dz);
	};


	/*
		Make a 2D array of X/Z coords in
		spiral order: so load chunks closest first.
	*/
	utils.spiral2D = function (radius) {

		var w = 0, wdir = 1,
			h = 0, hdir = 1,
			x = 0,
			y = 0,
			path = [];

		// Spiral pattern
		while (radius--) {
			w++;
			h++;

			// Moving left/up
			for (;x < w * wdir; x += wdir) {
				path.push([x, y]);
			}

			for (;y < h * hdir; y += hdir) {
				path.push([x, y]);
			}

			wdir = wdir * -1;
			hdir = hdir * -1;

			// Moving right/down
			for (;x > w * wdir; x += wdir) {
				path.push([x, y]);
			}

			for (;y > h * hdir; y += hdir) {
				path.push([x, y]);
			}

			wdir = wdir * -1;
			hdir = hdir * -1;

		}

		return path;
	};

	// extends 'from' object with members from 'to'. If 'to' is null, a deep clone of 'from' is returned
	utils.extend = function (from, to) {
	    if (from === null || typeof from !== "object") return from;
	    if (from.constructor != Object && from.constructor != Array) return from;
	    if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
	        from.constructor == String || from.constructor == Number || from.constructor == Boolean)
	        return new from.constructor(from);

	    to = to || new from.constructor();

	    for (var name in from)
	    {
	        to[name] = typeof to[name] == "undefined" ? utils.extend(from[name], null) : to[name];
	    }

	    return to;
	};

	/*
		Could do this with three camera and figure out face pos,
		but I want to do it on the voxel model itself so it
		doesn't need the front-end. Maybe make a text adventure
		out of it...

		> GO WEST
		> ... THERE ARE CUBES TO THE EAST, BOTTOM WEST, BOTTOM...

	*/
	utils.raycast = function (origin, direction, radius, callback) {

		function intbound(s, ds) {
		  // Find the smallest positive t such that s+t*ds is an integer.
		  if (ds < 0) {
			return intbound(-s, -ds);
		  } else {
			s = mod(s, 1);
			// problem is now s+t*ds = 1
			return (1 - s) / ds;
		  }
		}

		function signum(x) {
		  return x > 0 ? 1 : x < 0 ? -1 : 0;
		}

		function mod(value, modulus) {
		  return (value % modulus + modulus) % modulus;
		}

		// From "A Fast Voxel Traversal Algorithm for Ray Tracing"
		// by John Amanatides and Andrew Woo, 1987
		// <http://www.cse.yorku.ca/~amana/research/grid.pdf>
		// <http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.42.3443>
		// The foundation of this algorithm is a parameterized representation of
		// the provided ray,
		//                    origin + t * direction,
		// except that t is not actually stored; rather, at any given point in the
		// traversal, we keep track of the *greater* t values which we would have
		// if we took a step sufficient to cross a cube boundary along that axis
		// (i.e. change the integer part of the coordinate) in the variables
		// tMaxX, tMaxY, and tMaxZ.

	  	// Cube containing origin point.
	  	var x = Math.floor(origin.x),
	  		y = Math.floor(origin.y),
	  		z = Math.floor(origin.z);

	  	// Break out direction vector.
	  	var dx = direction.x,
	  		dy = direction.y,
	  		dz = direction.z;

	  // Direction to increment x,y,z when stepping.
	  var stepX = signum(dx);
	  var stepY = signum(dy);
	  var stepZ = signum(dz);
	  // See description above. The initial values depend on the fractional
	  // part of the origin.
	  var tMaxX = intbound(origin.x, dx);
	  var tMaxY = intbound(origin.y, dy);
	  var tMaxZ = intbound(origin.z, dz);
	  // The change in t when taking a step (always positive).
	  var tDeltaX = stepX/dx;
	  var tDeltaY = stepY/dy;
	  var tDeltaZ = stepZ/dz;
	  // Buffer for reporting faces to the callback.
	  var face = { x: null, y: null, z: null }; //new THREE.Vector3();

	  // Avoids an infinite loop.
	  if (dx === 0 && dy === 0 && dz === 0)
		throw new RangeError("Raycast in zero direction!");

	  // Rescale from units of 1 cube-edge to units of 'direction' so we can
	  // compare with 't'.
	  radius /= Math.sqrt(dx*dx+dy*dy+dz*dz);

	  var calledBack = false;
		while(true) {

		// Invoke the callback
		  if (callback(x, y, z, face)) {
			calledBack = true;
			break;
		  }

		// tMaxX stores the t-value at which we cross a cube boundary along the
		// X axis, and similarly for Y and Z. Therefore, choosing the least tMax
		// chooses the closest cube boundary. Only the first case of the four
		// has been commented in detail.
		if (tMaxX < tMaxY) {
		  if (tMaxX < tMaxZ) {
			if (tMaxX > radius) break;
			// Update which cube we are now in.
			x += stepX;
			// Adjust tMaxX to the next X-oriented boundary crossing.
			tMaxX += tDeltaX;
			// Record the normal vector of the cube face we entered.
			face.x = -stepX;
			face.y = 0;
			face.z = 0;
		  } else {
			if (tMaxZ > radius) break;
			z += stepZ;
			tMaxZ += tDeltaZ;
			face.x = 0;
			face.y = 0;
			face.z = -stepZ;
		  }
		} else {
		  if (tMaxY < tMaxZ) {
			if (tMaxY > radius) break;
			y += stepY;
			tMaxY += tDeltaY;
			face.x = 0;
			face.y = -stepY;
			face.z = 0;
		  } else {
			// Identical to the second case, repeated for simplicity in
			// the conditionals.
			if (tMaxZ > radius) break;
			z += stepZ;
			tMaxZ += tDeltaZ;
			face.x = 0;
			face.y = 0;
			face.z = -stepZ;
		  }
		}
	  }
	  if (!calledBack) {
		callback("miss");
	  }
	};

	core.utils = utils;

	if (typeof module !== "undefined") {
		module.exports = core;
	} else {
		window.core = core;
	}

}());
