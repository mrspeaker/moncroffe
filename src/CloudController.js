(function () {

	"use strict";

	var CloudController = {

		clouds: null,

		init: function (area, numClouds, scene) {
			this.area = area;
			this.numClouds = numClouds;

			this.clouds = [];
			var cloud;
			for (var i = 0; i < numClouds; i++) {
				cloud = Object.create(Cloud).init(
					new THREE.Vector3(
						Math.random() * 500 - 250,
						52,
						Math.random() * 500 - 250
					)
				);

				this.clouds.push(cloud);
				scene.add(cloud.mesh);
			}

			return this;
		},

		randCloud: function (cloud) {


		},

		tick: function (dt) {

			this.clouds.forEach(function (c) {

				return c.tick(dt);

			});

		}
	};

	window.CloudController = CloudController;

}());