var WorldScreen = {

	scene: null,

	doAddBlock: false,
	doRemoveBlock: false,

	init: function (screen) {

		//this.scene = new THREE.Scene();
		this.scene = screen.scene;
		this.screen = screen;

		screen.world = Object.create(World).init(screen, screen.network.world.seed);
		screen.player = Object.create(Player).init(screen);
		screen.cursor = Object.create(Cursor).init(screen);

		screen.bindHandlers();

		screen.addLights();
		screen.addStratosphere();
		screen.updateDayNight();

		screen.world.createChunks();

		return this;
	},

	tick: function (dt) {

		var scr = this.screen;

		scr.player.tick(dt);
		scr.bullets = scr.bullets.filter(function (b) {
			var ret = b.tick(dt);
			if (ret) {
				var block = scr.world.getBlockAtPos(b.pos);
				if (block.type !== "air") {
					b.stop();
				}
			} else {
				scr.scene.remove(b.mesh);
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
				scr.scene.remove(t.mesh);
			} else {
				// If not to far out into space...

				if (Math.abs(t.pos.x - xo) < maxX * 1.3 && Math.abs(t.pos.z - zo) < maxZ * 1.3) {
					var hit = scr.bullets.some(function (b) {
						return !b.stopped && utils.dist(b.pos, t.pos) < 2;
					});
					if (hit) {
						ret = false;
						scr.scene.remove(t.mesh);
						scr.explodeParticles(t.pos);
					}
				}
			}
			return ret;
		}, this);

		scr.particles = scr.particles.filter(function (p) {
			var t = p.tick(dt);
			if (!t) {
				scr.scene.remove(p.mesh);
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
			scr.scene.add(target.mesh);
		}

		if (scr.frame % 50 === 0) {
			scr.updateDayNight();
		}

		if (this.doAddBlock) {
			var added = scr.world.addBlockAtCursor(scr.cursor, scr.player.curTool, []);
			if (!added) {
				this.screen.fire();
			}
			this.doAddBlock = false;
		}

		if (this.doRemoveBlock) {
			scr.world.removeBlockAtCursor(scr.cursor);
			this.doRemoveBlock = false;
		}

		// Do update ping
		scr.network.tick(scr.player.playerObj);

	}

};
