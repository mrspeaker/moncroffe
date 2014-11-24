(function () {

	var Particle = {

		count: 0,
		vy: 0,

		init: function (size, pos, material, isClown, dir) {

			this.life = 100 + (Math.random() * 50 | 0);

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

			this.dir = dir;

			return this;
		},

		tick: function (dt) {

			var m = this.mesh,
				pow = dt * 2;

			m.translateX(pow);
			m.translateY(pow);
			m.translateZ(pow);

			if (this.dir && (this.count / this.life) > 0.25) {
				this.mesh.lookAt(this.dir);
				this.dir = null;
			}

			if (!this.dir || (this.count / this.life) > 0.25) {
				this.vy += 0.001;
				m.position.y -= this.vy;
			}


			return this.count++ < this.life;

		}

	};

	window.Particle = Particle;

}());