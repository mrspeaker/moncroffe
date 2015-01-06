(function () {

	var Particle = {

		count: 0,
		vy: 0,

		init: function (pos, material, isClown, dir, deets) {

			for (var k in deets) {
				this[k] = deets[k];
			}

			var size = this.size || 0.3;
			this.life = this.life || 100 + (Math.random() * 50 | 0);

			this.mesh = new THREE.Mesh(
				utils.texturify(
					new THREE.CubeGeometry(size),
					isClown ?
						[[7, 8], [6, 8], [6, 8], [6, 8], [7, 9], [6, 9]] :
						[[4, 9], [4, 9], [4, 9], [4, 9], [5, 9], [5, 9]]
				),
				material
			);

			this.mesh.position.copy(pos);
			this.mesh.lookAt(new THREE.Vector3(
				pos.x + ((Math.random ()) - 0.5),
				pos.y + 1,
				pos.z + ((Math.random ()) - 0.5)
			));

			this.isClown = isClown;
			this.dir = dir;
			this.speedOffset = (Math.random() * 10) / 100;

			return this;
		},

		tick: function (dt) {

			var m = this.mesh,
				pow = dt + (dt * this.speedOffset),
				stageOne = !this.isClown || this.count / this.life <= 0.15,
				stageTwo = !stageOne;

			if (stageOne) {
				//m.translateX(pow);
				//m.translateY(pow);
				m.position.y += pow + pow;

				m.rotation.x += 0.1;
				m.rotation.y += 0.11;
				m.rotation.z += 0.12;

			} else {
				m.translateX(pow / 2);
				m.translateY(pow / 2);
				m.translateZ(pow + pow + pow);
			}

			if (this.dir && stageTwo) {
				this.mesh.lookAt(this.dir);
				this.dir = null;
			}

			// Fall (if no box direction, or being pulled.)
			if (!this.dir || stageTwo) {
				this.vy += 0.001;
				m.position.y -= this.vy;
			}

			return this.count++ < this.life;

		}

	};

	window.Particle = Particle;

}());