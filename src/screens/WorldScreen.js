var WorldScreen = {

	scene: null,

	doAddBlock: false,
	doRemoveBlock: false,

	cursor: null,
	player: null,
	particles: null,


	lights: {},

	stratosphere: {
		skybox: null,
		nightbox: null,
		uniforms: null,
	},

	init: function (screen) {

		this.scene = new THREE.Scene();
		this.screen = screen;

		screen.world = Object.create(World).init(screen, this.scene, screen.network.world.seed);
		this.player = Object.create(Player).init(this);
		this.cursor = Object.create(Cursor).init(this);
		this.particles = [];


		screen.bindHandlers(this.player);

		this.addLights();
		this.addStratosphere();
		this.updateDayNight();

		screen.world.createChunks();

		return this;
	},

	addLights: function () {

		this.lights.ambientLight = new THREE.AmbientLight(0x999999);
		this.scene.add(this.lights.ambientLight);

		this.lights.player = new THREE.PointLight(0xF3AC44, 1, 8);
		this.screen.camera.add(this.lights.player); // light follows player

		// One of these guys turns out when player turns on!
		var light = new THREE.PointLight(0xF4D2A3, 1, 10);
		light.position.set(this.screen.world.chunkWidth - 5, 5, this.screen.world.chunkWidth - 5);
		this.scene.add(light);

		var light2 = new THREE.PointLight(0xF4D2A3, 1, 10);
		light2.position.set(2 * this.screen.world.chunkWidth - 3, 5, 2 * this.screen.world.chunkWidth - 3);
		this.scene.add(light2);

		this.scene.fog = new THREE.Fog(0xE8D998, 10, 80);

	},

	addStratosphere: function () {

		// Stary night
		var nightGeometry = new THREE.SphereGeometry(200, 32, 15),
			nightMaterial = new THREE.MeshLambertMaterial({
				map: this.screen.textures.night,
				fog: false,
				ambient: new THREE.Color(0xaaaaaa),
				side: THREE.BackSide
			});

		var night = this.stratosphere.nightbox = new THREE.Mesh(nightGeometry, nightMaterial);
		night.visible = false;

		// Horizon day shader
		var uniforms = this.stratosphere.uniforms = {
			topColor: { type: "c", value: new THREE.Color(0x88C4EC) },
			bottomColor: { type: "c", value: new THREE.Color(0xE8D998) },
			offset: { type: "f", value: 40 },
			exponent: { type: "f", value: 0.6 }
		};

		var skyGeometry = new THREE.SphereGeometry(200, 32, 15),
			skyMaterial = new THREE.ShaderMaterial({
				uniforms: uniforms,
				vertexShader:  document.getElementById("vHemisphere").textContent,
				fragmentShader: document.getElementById("fHemisphere").textContent,
				side: THREE.BackSide
			});

		var sky = this.stratosphere.skybox = new THREE.Mesh(skyGeometry, skyMaterial);

		this.scene.add(sky);
		this.scene.add(night);

	},

	updateDayNight: function () {

		var time = (this.screen.world.elapsed % 160) / 80; // (% 1x day/night cycle) / 0.5x; (in seconds)

		if (time > 1) {
			time = 1 + (1 - time);
		}

		this.scene.fog.color.copy(new THREE.Color(0xE8D998).lerp(new THREE.Color(0x000000), time));

		this.scene.remove(this.lights.ambientLight);
		this.lights.ambientLight = new THREE.AmbientLight((new THREE.Color(0x999999)).lerp(new THREE.Color(0x2f2f2f), time));
		this.scene.add(this.lights.ambientLight);

		this.lights.player.visible = time > 0.5;

		this.stratosphere.uniforms.topColor.value = new THREE.Color(0x88C4EC).lerp(new THREE.Color(0x000000), time);
		this.stratosphere.uniforms.bottomColor.value = new THREE.Color(0xE8D998).lerp(new THREE.Color(0x000000), time);
		this.stratosphere.skybox.visible = time < 0.875;
		this.stratosphere.nightbox.visible = time >= 0.875;

	},

	explodeParticles: function (pos) {

		for (var i = 0; i < 10; i++) {
			var p = Object.create(Particle).init(
				0.3,
				new THREE.Vector3(
					pos.x + ((Math.random() * 3) - 1.5),
					pos.y + ((Math.random() * 3) - 1.5),
					pos.z + ((Math.random() * 3) - 1.5)),
				this.screen.materials.target);
			this.scene.add(p.mesh);
			this.particles.push(p);
		}

	},

	tick: function (dt) {

		var scr = this.screen;

		this.player.tick(dt);
		scr.bullets = scr.bullets.filter(function (b) {
			var ret = b.tick(dt);
			if (ret) {
				var block = scr.world.getBlockAtPos(b.pos);
				if (block.type !== "air") {
					b.stop();
				}
			} else {
				this.scene.remove(b.mesh);
			}
			return ret;
		}, this);

		var maxX = scr.world.maxX,
			maxZ = scr.world.maxZ,
			xo = scr.world.xo,
			zo = scr.world.zo;

		scr.targets = scr.targets.filter(function (t) {
			var ret = t.tick(dt);
			if (!ret) {
				this.scene.remove(t.mesh);
			} else {
				// If not to far out into space...

				if (Math.abs(t.pos.x - xo) < maxX * 1.3 && Math.abs(t.pos.z - zo) < maxZ * 1.3) {
					var hit = scr.bullets.some(function (b) {
						return !b.stopped && utils.dist(b.pos, t.pos) < 2;
					});
					if (hit) {
						ret = false;
						this.scene.remove(t.mesh);
						this.explodeParticles(t.pos);
					}
				}
			}
			return ret;
		}, this);

		this.particles = this.particles.filter(function (p) {
			var t = p.tick(dt);
			if (!t) {
				this.scene.remove(p.mesh);
			}
			return t;
		}, this);

		scr.world.tick(dt);

		// Add a pumpkin
		if (Math.random() < 0.01) {
			var target = Object.create(Target).init(
				new THREE.Vector3(
					xo + (Math.random() * (maxX * 0.3) * 2) - (maxX * 0.3),
					(Math.random() * 13 | 0) + 0.75,
					zo + (Math.random() * (maxZ * 0.3) * 2) - (maxZ * 0.3)
				),
				new THREE.Vector3(
					Math.random() - 0.5,
					0,
					Math.random() - 0.5
				),
				scr.materials.target);
			scr.targets.push(target);
			this.scene.add(target.mesh);
		}

		if (scr.frame % 50 === 0) {
			this.updateDayNight();
		}

		if (this.doAddBlock) {
			var added = scr.world.addBlockAtCursor(this.cursor, this.player.curTool, []);
			if (!added) {
				this.screen.fire();
			}
			this.doAddBlock = false;
		}

		if (this.doRemoveBlock) {
			scr.world.removeBlockAtCursor(this.cursor);
			this.doRemoveBlock = false;
		}

		// Do update ping
		scr.network.tick(this.player.playerObj);

	}

};
