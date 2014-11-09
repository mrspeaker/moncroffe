(function () {

	var Particle = {

		count: 0,
		vy: 0,

		init: function (size, pos, material) {

			this.life = 80 + (Math.random() * 30 | 0);

			this.mesh = new THREE.Mesh(
				new THREE.BoxGeometry(size, size, size),
				material
			);

			this.mesh.position.copy(pos);
			this.mesh.lookAt(new THREE.Vector3(
				pos.x + ((Math.random ()) - 0.5),
				pos.y + 1,
				pos.z + ((Math.random ()) - 0.5)
			));

			return this;
		},

		tick: function (dt) {

			var m = this.mesh,
				pow = dt * 1;

			m.translateX(pow);
			m.translateY(pow);
			m.translateZ(pow);

			this.vy += 0.001;

			m.position.y -= this.vy;

			return this.count++ < this.life;

		}

	};

	window.Particle = Particle;

}());