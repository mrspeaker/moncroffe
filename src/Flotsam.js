(function () {

	"use strict";

	var Flotsam = {

		flotsam: null,

		init: function (scene) {

			this.flotsam = [];

			this.add(scene);

			return this;
		},

		add: function (scene) {

			function getBlock(x, y) {
				return [
					x / 16, y / 16,
					(x + 1) / 16, y / 16,
					x / 16, (y + 1) / 16,
					(x + 1) / 16, (y + 1) / 16
				];
			}

			var flotsamMaterial = new THREE.SpriteMaterial({
				map: THREE.ImageUtils.loadTexture("res/images/bubble.png"),
				tranparency: false,
				fog: true
			});

			var d = data.world.radius * 2 * data.chunk.w;
			for (var i = 0; i < 1000; i ++) {

				var flotsam = new THREE.Sprite(
					flotsamMaterial,
					getBlock(Math.random() * 15 | 0, Math.random() * 8 | 0)
				);

				flotsam.position.set(
					Math.random() * d - (d / 2),
					Math.random() * data.world.seaLevel,
					Math.random() * d - (d / 2)  + (data.chunk.w)
				);

				var size = (Math.random() * 0.08) + 0.05;
				flotsam.scale.set(size, size, size);
				this.flotsam.push(flotsam);
				scene.add(flotsam);
			}
		},

		tick: function (dt) {

			this.flotsam.forEach(function (sf) {

				if ((sf.position.y += 0.015) > data.world.seaLevel) {
					sf.position.y = 0;
				}

			});

		}
	};

	window.Flotsam = Flotsam;

}());
