(function () {

	"use strict";

	var WorldScreen = {

		scene: null,

		name: "WorldScreen",

		doAddBlock: false,
		doRemoveBlock: false,

		useAO: true,

		cursor: null,
		player: null,
		particles: null,
		bullets: null,
		targets: null,
		bouy: null,
		world: null,
		clouds: null,

		lights: {},

		stratosphere: {
			skybox: null,
			nightbox: null,
			uniforms: null,
		},

		flashTime: 0,
		flashType: "",

		elapsed: 0,
		state: "BORN",
		stateFirst: true,
		remaining: 0,

		round: 0,
		doneInitialReset: false,

		scores: null,

		init: function (screen) {

			this.waypoints = [];

			this.sounds = {
				shoot: Object.create(Sound).init("res/audio/laz1", 0.15),
				die: Object.create(Sound).init("res/audio/dead", 0.9),
				find: Object.create(Sound).init("res/audio/getget2", 0.7),
				bip: Object.create(Sound).init("res/audio/bip", 0.8),
				splode: Object.create(Sound).init("res/audio/lololp2", 0.6)
			};

			this.screen = screen;
			this.scene = new THREE.Scene();

			this.player = Object.create(Player).init(this);
			this.cursor = Object.create(Cursor).init(this);
			this.bullets = [];
			this.targets = [];
			this.particles = [];
			this.scores = [];

			screen.bindHandlers(this.player);

			var material = new THREE.MeshBasicMaterial({
					color: 0x1EABFF,
					transparent: true,
					opacity: 0.6,
					side: THREE.DoubleSide
				}),
				geom = new THREE.PlaneGeometry(150, 150),
				mesh = new THREE.Mesh(geom, material);

			mesh.rotation.x = -Math.PI/2;
			mesh.position.set(0, data.world.seaLevel, 0);

			this.scene.add(mesh);

			this.addLights();
			this.addStratosphere();
			this.updateDayNight();

			this.flotsam = Object.create(Flotsam).init(this.scene);
			this.clouds = Object.create(Clouds).init(null, 80, this.scene);

			return this;
		},

		reset: function () {

			// remove old chunks...
			if (this.world) this.world.removeChunks();

			// Readd the new ones...
			this.world = Object.create(World).init(this, Network.world.seed);
			this.world.createChunks();

			this.doneInitialReset = true;

		},

		findyCube: function () {

			var c = new THREE.Mesh(
				utils.texturify(
					new THREE.CubeGeometry(0.8),
					[[1, 8], [1, 8], [1, 8], [1, 8], [1, 8], [1, 8]]
				),
				data.materials.blocks
			);

			this.scene.add(c);
			c.position.set(3, 18, 3);
			this.findy = c;

		},

		addWayPoints: function () {

			// Testing ai
			this.waypoints.forEach(function (w) {

				var mesh = new THREE.Mesh(
					utils.texturify(
						new THREE.CubeGeometry(0.5),
						[[4, 9], [4, 9], [4, 9], [4, 9], [5, 9], [5, 9]]
					),
					data.materials.target
				);

				mesh.position.set(w[0], w[1], w[2]);

				this.scene.add(mesh);


			}, this);

		},

		addBouy: function () {

			this.bouy = Object.create(Bouy).init(data.materials.blocks);
			// this.bouy.mesh.add(this.lights.cube);
			// this.lights.cube.position.set(0, 1, 0);
			//
			this.scene.add(this.bouy.mesh);

		},

		addLights: function () {

			this.lights.ambientLight = new THREE.AmbientLight(0x999999);
			this.scene.add(this.lights.ambientLight);

			this.lights.player = new THREE.PointLight(0xF4D2A3, 1, 8);//(0xF3AC44, 1, 8);
			this.screen.camera.add(this.lights.player); // light follows player

			var light = new THREE.PointLight(0xF4D2A3, 1, 10);
			light.position.set(data.chunk.w - 5, 5, data.chunk.w - 5);
			this.scene.add(light);

			var light2 = new THREE.PointLight(0xF4D2A3, 1, 10);
			light2.position.set(data.world.radius * data.chunk.w - 3, 5, data.world.radius * data.chunk.w - 3);
			this.scene.add(light2);

			this.lights.cube = new THREE.PointLight(0xF4D0000, 12, 4);
			this.lights.cube.position.set(0, -5, 0);
			this.scene.add(this.lights.cube);

			//this.fog.above = new THREE.Fog(0xE8D998, 10, 80);
			this.scene.fog = new THREE.FogExp2(0x0000aa, 0.05);

		},

		addStratosphere: function () {

			// Stary night
			var nightGeometry = new THREE.SphereGeometry(200, 32, 15),
				nightMaterial = new THREE.MeshLambertMaterial({
					map: data.textures.night,
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
				offset: { type: "f", value: 90 },
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

			var time = (this.elapsed % 160) / 80; // (% 1x day/night cycle) / 0.5x; (in seconds)

			if (time > 1) {
				time = 1 + (1 - time);
			}

			//this.scene.fog.color.copy(new THREE.Color(0xE8D998).lerp(new THREE.Color(0x000000), time));
			this.lights.ambientLight.color = (new THREE.Color(0x999999)).lerp(new THREE.Color(0x2f2f2f), time);
			this.lights.player.intensity = time > 0.5 ? 1 : 0;

			var strat = this.stratosphere;
			strat.uniforms.topColor.value = new THREE.Color(0x88C4EC).lerp(new THREE.Color(0x000000), time);
			strat.uniforms.bottomColor.value = new THREE.Color(0xE8D998).lerp(new THREE.Color(0x000000), time);
			strat.skybox.visible = time < 0.875;
			strat.nightbox.visible = time >= 0.875;

		},

		explodeParticles: function (pos, isClown, dir) {

			if (!pos) {
				console.error("no pos?", pos, isClown, dir);
				return;
			}

			for (var i = 0; i < 10; i++) {
				var p = Object.create(Particle).init(
					0.3,
					new THREE.Vector3(
						pos.x + ((Math.random() * 3) - 1.5),
						pos.y + ((Math.random() * 3) - 1.5),
						pos.z + ((Math.random() * 3) - 1.5)),
					isClown ? data.materials.target : data.materials.blocks,
					isClown,
					dir);
				this.scene.add(p.mesh);
				this.particles.push(p);
			}

		},

		setEveryoneSafeBlinky: function () {

			for (var p in Network.clients) {

				var player = Network.clients[p];
				// todo: 150 magic number
				player.blinkTime = 150;
			}

		},

		clownDestroyed: function (id) {
			this.targets = this.targets.filter(function (t) {
				var deadPump = t.id === id;
				if (deadPump) {
					this.scene.remove(t.mesh);
					this.explodeParticles(t.pos, true);
				}
				return !deadPump;
			}, this);
		},

		otherFiredBullet: function (bullet) {

			var b = Object.create(Bullet).init(
				new THREE.Vector3(bullet.pos.x, bullet.pos.y, bullet.pos.z),
				new THREE.Vector3(bullet.dir.x, bullet.dir.y, bullet.dir.z),
				data.materials.bullet
			);

			b.ownShot = false;
			this.bullets.push(b);
			this.scene.add(b.mesh);

		},

		receiveShotPlayer: function (hitData) {

			var pid = hitData.hit,
				byId = hitData.by,
				hitPlayer = Network.getPlayer(pid),
				byPlayer = Network.getPlayer(byId);

			if (pid === Network.clientId) {
				this.player.respawn();
				this.flashType = "dead";
				this.flashTime = 100;
				this.sounds.die.play();

				this.receiveChat([-2, "You were hit" + (byPlayer ? " by " + byPlayer.name : "")]);
				return;
			}

			if (hitPlayer) {

				var msg;

				if (byId === Network.clientId) {
					msg = "You killed " + hitPlayer.name + ".";
				} else {
					msg = hitPlayer.name + " was hit" +
						(byPlayer ? " by " + byPlayer.name : "") + ".";
				}

				this.explodeParticles(hitPlayer.model.pos, false);
				// todo: 150 magic number
				hitPlayer.blinkTime = 150;
				this.receiveChat([-2, msg]);
			}
		},

		pingReceived: function (ping) {

			var bouy = this.bouy;

			if (ping.state !== this.state) {
				this.stateFirst = true;
				if (ping.state === "ROUND_READY" && ping.seed) {
					Network.world.seed = ping.seed;
					this.round = ping.round;
				}

				if (ping.state === "GAME_OVER") {
					utils.showMsg("#gameOver", data.rounds.duration.gameOver - 0.1);
				}
			}
			this.state = ping.state;
			this.remaining = ping.remaining;

			var msg = this.state;
			if (this.state == "ROUND") {
				msg += " " + (this.round + 1) +
					" of " + data.rounds.total +
					". " +
					(core.utils.formatTime(this.remaining | 0));
			}
			utils.msg(msg + "..." + (this.screen.hue.value * 100).toFixed(2));

			this.scores = [];
			ping.players.forEach(function (p) {

				var isSelf = p.id === Network.clientId,
					player = Network.clients[p.id];

				if (!player) {
					// TODO: no name on connect, only join!
					console.log("Player joined:", p.id, p.name);

					player = Network.clients[p.id] = Object.create(PlayerProxy).init(p.id, p.name, isSelf);
					this.scene.add(player.mesh);

				} else {
					// no name on connect, only join... so update here
					if (Network.clients[p.id].name !== p.name) {
						Network.clients[p.id].name = p.name;
						this.receiveChat([-1, p.name + " joined."]);
					}
				}

				if (!isSelf) {
					player.model.pos = p.pos;
					player.model.rot = p.rot;
				}

				this.scores.push({name: p.name, score: p.score});
			}, this);

			this.scores = this.scores.sort(function (a, b) {
				return b.score - a.score;
			});

			this.scores.forEach(function (s, i) {
				utils.msgln(
					(i === 0 ? "<strong>" : "") +
					s.name + ": " + s.score +
					(i === 0 ? "</strong>" : ""));
			});

			// Add new clowns
			ping.targets.forEach(function (t) {
				var target = Object.create(Clown).init(
					t.id,
					new THREE.Vector3(
						t.pos.x,
						t.pos.y,
						t.pos.z
					),
					new THREE.Vector3(
						t.rot.x,
						t.rot.y,
						t.rot.z
					),
					t.speed,
					data.materials.target);
				this.targets.push(target);
				if (bouy) {
					target.bouyDir = bouy.mesh.position.clone();
				}
				this.scene.add(target.mesh);
			}, this);

			if (ping.bouy) {
				var pb = ping.bouy;
				if (!this.bouy) {
					this.addBouy();
				}
				var bouyPos = this.bouy.model.origPos;

				if (pb.x !== bouyPos.x ||
					pb.y !== bouyPos.y ||
 					pb.z !== bouyPos.z) {

					// Set the new pos
					this.bouy.setPos(ping.bouy);
					this.lights.cube.position.set(pb.x, pb.y, pb.z);

					// Update the targets
					this.targets.forEach(function (t) {
						t.bouyDir = this.bouy.mesh.position.clone();
					}, this);

				}

			} else {
				// Hack - if bouy killed, move it away
				if (this.bouy) {
					this.bouy.mesh.position.set(0, -3, 0);
				}
			}

			if (ping.flash) {
				// THIS means someone got bouy...
				this.flashTime = 100;
				this.flashType = "get";

				var player = Network.getPlayer(ping.flash);
				var name = player.name;

				player.hasBouy = true;

				// TODO! ENCODE!
				document.querySelector("#playerGetName").innerHTML = name;
				utils.showMsg("#hudMsg", 3);
				this.receiveChat([-3, name + " got the box."]);

				this.sounds.find.play();
			}

			this.elapsed = ping.elapsed;
		},

		getLeaders: function () {
			return this.scores
				.filter(function (s) {
					return s.score === this.scores[0].score;
				}, this)
				.map(function (s) {
					return s.name;
				})
				.join("<br />");
		},

		fire: function () {

			var ob = this.player.controls,
				origin = this.player.mesh.position.clone(),
				direction = ob.getDirection().clone();

			if (this.screen.isOculus) {
				// var vector = new THREE.Vector3( 0, 0, 1 );
				// var camMatrix = ob.getObject().children[0].children[0].matrixWorld;
				// vector.applyQuaternion(new THREE.Vector3().setFromRotationMatrix(camMatrix));
				// //vector.applyMatrix3(camMatrix);
				// //vector.matrix.multiply(camMatrix);
				// //direction.add(vector);// vector.angleTo( origin );
				// direction.copy(vector);
			}

			// Eh, to fire from another location need
			// to translate, then re-do getDirection logic
			if (!this.screen.isOculus) origin.y += 0.4;

			var bullet = Object.create(Bullet).init(origin, direction, data.materials.bullet);
			this.bullets.push(bullet);
			this.scene.add(bullet.mesh);
			bullet.ownShot = true;

			Network.fireBullet({
				pos: {
					x: origin.x,
					y: origin.y,
					z: origin.z
				},
				dir:  {
					x: direction.x,
					y: direction.y,
					z: direction.z
				}
			});

			this.sounds.shoot.rewind();
			var shoot = this.sounds.shoot;
			//setTimeout(function () {
				shoot.play();
			//}, 5);


		},

		cast: function () {

			var ob = this.player.controls,
				origin = ob.getObject().position.clone(),
				cursor = this.cursor,
				chs = this.world.chunks,
				chW = data.chunk.w,
				chH = data.chunk.h;

			origin.addScalar(0.5);

			core.utils.raycast(origin, ob.getDirection(), 5, function (x, y, z, face) {

				if (x === "miss") {
					cursor.hide();
					return false;
				}

				cursor.show();

				if (y < 0) y = 0; // looking below ground breaks
				if (y > chH - 1) y = chH - 1;

				var chunkX = Math.floor(x / chW),
					chunkZ = Math.floor(z / chW),
					chunk = chs[chunkX + ":" + chunkZ];

				if (!chunk) {
					return false;
				}

				// Set mesh to original position
				cursor.mesh.position.set(x, y + 0.5, z);

				x -= chunkX * chW;
				z -= chunkZ * chW;

				cursor.set({x: x, y: y, z: z}, {x: chunkX, z: chunkZ}, face);

				return chunk[z][y][x].type !== "air";
			});
		},

		tick: function (dt) {

			switch (this.state) {

			case "BORN":
				if (this.stateFirst) {
					this.reset();
				}
				break;

			case "ROUND_READY":
				if (this.stateFirst) {
					// Shoot up in the air
					var model = this.player.model;
					model.pos.y = 19;

					this.player.tick(dt);

					var msg = "";

					if (this.round === 0) {
						msg =
						"Find the magic boxes:" +
						"<img style='float:right;margin-top:-40px' src='res/images/box.png'/><br/>" +
						"Shoot the clowns for directions:" +
						"<img style='width:100px;float:right;margin-top:-40px' src='res/images/guys.png' />" +
						"<br/>Best of " + data.rounds.total + " "
					} else if (this.round === data.rounds.total - 1) {
						msg = "Final round<br/>";
					}
					else {
						msg = "Round " + (this.round + 1);
					}

					document.querySelector("#getReadyStage").innerHTML = msg;

					var roundDuration = this.round === 0 ?
						data.rounds.duration.firstRoundReady :
						data.rounds.duration.roundReady;

					utils.showMsg("#getReady", roundDuration - 0.1);
					var n = Date.now();
					(function countdown () {

						var cd = (roundDuration * 1000) - (Date.now() - n);
						cd = cd / 1000 | 0;
						document.querySelector("#gameStartsIn").innerHTML = cd;
						setTimeout(function () {
							if (cd > 0) countdown();
						}, 200);

					}());
				}
				break;

			case "ROUND":
				if (this.stateFirst) {
					if (!this.doneInitialReset) {
						this.reset();
					}
					this.setEveryoneSafeBlinky();
				}
				this.tick_ROUND(dt);
				break;

			case "ROUND_OVER":
				if (this.stateFirst && this.round < data.rounds.total - 1 ) {
					//document.querySelector("#roundWinner").innerHTML = this.getLeaders();
					utils.showMsg("#roundOver", data.rounds.duration.roundOver - 0.5);
				}
				break;
			}

			this.stateFirst = false;

			this.flotsam.tick(dt);
			if (this.clouds) this.clouds.tick(dt);

			var curY = this.player.model.pos.y,
				lastY = this.player.model.lastPos.y,
				sea = data.world.seaLevel - this.player.model.bb.h;

			//console.log(curY, lastY);
			if (curY >= sea && lastY < sea) {
				// Went up!
				this.scene.fog.density = 0.0005;
				this.scene.fog.color = new THREE.Color(0xE8D998);
				this.player.gravity = 9.8;
				this.player.jumpPower = 23;
				this.player.speed = 4.5
			}

			if (curY < sea && lastY >= sea) {
				// Went downs!
				this.scene.fog.density = 0.05;
				this.scene.fog.color = new THREE.Color(0x0000aa);
				this.player.gravity = 5.8;
				this.player.jumpPower = 18;
				this.player.speed = 5.5

			}

		},

		tick_ROUND: function (dt) {
			var scene = this.scene,
				world = this.world,
				camera = this.player.controls.getObject(),
				model = this.player.model;

			this.player.tick(dt);

			var pp = Network.clients[Network.clientId];
			if (pp) {
				pp.tick(dt);
				pp.model.pos.x = model.pos.x;
				pp.model.pos.y = model.pos.y;
				pp.model.pos.z = model.pos.z;
				pp.model.rot = model.rot;
			}

			this.bullets = this.bullets.filter(function (b) {
				var ret = b.tick(dt);
				if (ret) {
					var block = world.getBlockAtPos(b.model.pos);
					if (block.type !== "air") {
						b.stop();
					}
				} else {
					scene.remove(b.mesh);
				}
				return ret;
			});

			var maxX = data.world.maxX,
				maxZ = data.world.maxZ,
				xo = data.world.midX,
				zo = data.world.midZ;

			this.targets = this.targets.filter(function (t) {
				var ret = t.tick(dt);
				if (!ret) {
					scene.remove(t.mesh);
				} else {
					// If not to far out into space...
					if (Math.abs(t.pos.x - xo) < maxX * 1.3 && Math.abs(t.pos.z - zo) < maxZ * 1.3) {
						var hit = this.bullets.some(function (b) {
							return b.ownShot && !b.stopped && core.utils.dist(b.model.pos, t.pos) < t.model.bb.x;
						});
						if (hit) {
							ret = false;
							scene.remove(t.mesh);
							this.explodeParticles(t.pos, true, t.bouyDir);
							Network.targetHit(t.id);
							this.sounds.splode.play();
						}
					}
				}
				return ret;
			}, this);

			for (var p in Network.clients) {

				var player = Network.clients[p],
					self = player.id === Network.clientId,
					hit;

				player.tick(dt, camera);

				hit = this.bullets.some(function (b) {
					return !self &&
						b.ownShot &&
						!b.stopped &&
						core.utils.dist(b.model.pos, player.model.pos) < 1;
				});

				if (hit) {
					Network.shotPlayer(player.id);
				}
			}

			if (this.bouy) {
				this.bouy.tick(dt);
				var dist = core.utils.dist(this.player.model.pos, this.bouy.model.pos);
				if (dist < 2) {
					Network.gotBouy();
					this.bouy.mesh.position.set(0, -1, 0);
					this.bouy.model.pos = {
						x: 0,
						y: -10,
						z: 0
					}
				}
			}

			this.particles = this.particles.filter(function (p) {
				var t = p.tick(dt);
				if (!t) {
					scene.remove(p.mesh);
				}
				return t;
			});

			world.tick(dt);

			if (this.flashTime-- > 0) {
				this.lights.ambientLight.color = new THREE.Color(this.flashTime % 10 < 5 ?
					(this.flashType === "dead" ? 0xff0000 : 0xffffff) : 0x000000);
			}

			if (this.screen.frame % 50 === 0) {
				this.updateDayNight();
			}

			if (this.doAddBlock) {
				var pos = this.player.model.pos,
					bb = this.player.model.bb;
				var added = world.addBlockAtCursor(
					this.cursor,
					this.player.model.tool,
					[
						// Ensure don't draw on yourself...
						// Not conviced about the Y checks here... should they be rounded? why -0.5?! Dang it!
						// works though.
						[pos.x - (bb.x / 2), pos.y - (bb.y / 2), pos.z - (bb.z / 2)],
						[pos.x + (bb.x / 2), pos.y - (bb.y / 2), pos.z - (bb.z / 2)],
						[pos.x - (bb.x / 2), pos.y - (bb.y / 2), pos.z + (bb.z / 2)],
						[pos.x + (bb.x / 2), pos.y - (bb.y / 2), pos.z + (bb.z / 2)],

						[pos.x - (bb.x / 2), pos.y + (bb.y / 2) - 0.5, pos.z - (bb.z / 2)],
						[pos.x + (bb.x / 2), pos.y + (bb.y / 2) - 0.5, pos.z - (bb.z / 2)],
						[pos.x - (bb.x / 2), pos.y + (bb.y / 2) - 0.5, pos.z + (bb.z / 2)],
						[pos.x + (bb.x / 2), pos.y + (bb.y / 2) - 0.5, pos.z + (bb.z / 2)]
					]);

				if (!added) {
					this.fire();
					this.player.knockback();
				}
				this.doAddBlock = false;
			}

			if (this.doRemoveBlock) {
				world.removeBlockAtCursor(this.cursor);
				this.doRemoveBlock = false;
			}

			// Do update ping
			Network.tick(this.player.model);

		},

		// Sees if the coast is clear to move a given amount
		// cur position (xyz), bounding box (xyz), move amount (xyz)

		// TODO: needs to be moved to server, pass in world dep.
		tryMove: function (p, bb, move) {

			var block = this.world.isBlockAt.bind(this.world);

			var xl = Math.round(p.x - (bb.x / 2)),
				xr = Math.round(p.x + (bb.x / 2)),
				nxl = Math.round((p.x + move.x) - (bb.x / 2)),
				nxr = Math.round((p.x + move.x) + (bb.x / 2));

			var zl = Math.round(p.z - (bb.z / 2)),
				zr = Math.round(p.z + (bb.z / 2)),
				nzl = Math.round((p.z + move.z) - (bb.z / 2)),
				nzr = Math.round((p.z + move.z) + (bb.z / 2));

			var yb = Math.round(p.y - (bb.y / 2)),
				yt = Math.round(p.y + (bb.y / 2) - 0.5),
				nyb = Math.round((p.y + move.y) - (bb.y / 2) - 0.5), // Erm, why -0.5? dunno. Mabye replace yb/yt Math.round with floor.
				nyt = Math.round((p.y + move.y) + (bb.y / 2) - 0.5);

			// Ensure not out of bounds: down or up.
			if (nyb < 0) nyb = 0;
			if (nyt < 1) nyt = 1;
			if (nyt > data.chunk.h - 1) nyt = data.chunk.h - 1;

			// Check forward/backward
			if (!(
				block(xl, yb, nzl) || block(xr, yb, nzl) || block(xl, yb, nzr) || block(xr, yb, nzr) ||
				block(xl, yt, nzl) || block(xr, yt, nzl) || block(xl, yt, nzr) || block(xr, yt, nzr)
			)) {
				p.z += move.z;
				zl = nzl;
				zr = nzr;
			}

			// Check left/right
			if (!(
				block(nxl, yb, zl) || block(nxl, yb, zr) || block(nxr, yb, zl) || block(nxr, yb, zr) ||
				block(nxl, yt, zl) || block(nxl, yt, zr) || block(nxr, yt, zl) || block(nxr, yt, zr)
			)) {
				p.x += move.x;
				xl = nxl;
				xr = nxr;
			}

			// Check bottom
			var hitGround = true,
				pushingAndJumping = (move.y > 0 && (move.z || move.y));
			if (pushingAndJumping || !(block(xl, nyb, zl) || block(xr, nyb, zl) || block(xl, nyb, zr) || block(xr, nyb, zr))) {
				hitGround = false;
				p.y += move.y;
			} else {
				p.y = yb + (bb.y / 2);
			}

			// Check top:
			/*
				TODO: this ain't quite right - "slide down" cubes
				Always detects a head hit if you are jumping and pushing.
				It's detecting the sides not just the top
				- Maybe a resolution problem: if sides, move back, if top move down
				- Maybe because of forward/back and left/right done togetehr?
			*/
			if (block(xl, nyt, zl) || block(xr, nyt, zl) || block(xl, nyt, zr) || block(xr, nyt, zr)) {
				//p.y = nyt - (bb.y / 2); // can't force down because it's detecting sides, not just top
				hitGround = true;
			}

			return { x: p.x, y: p.y, z: p.z, ground: hitGround };
		},

		receiveChat: function (msg) {

			var inner,
				name,
				post;

			inner = document.querySelector("#chatLog").innerHTML;
			inner = inner.slice(0, 500);

			if (typeof msg[0] == "string") {
				name = Network.getName(msg[0]),
				post = name + ": " + msg[1];
				this.sounds.bip.play();
			} else {
				post = "<span class='" +
				["", "ev_join", "ev_kill", "ev_get"][Math.abs(msg[0])] +
				"'>" + msg[1] + "</span>";
			}


			document.querySelector("#chatLog").innerHTML = post + "<br/>" + inner;

		},

		receiveScores: function (scores) {

			var els = ["<table style='display:inline-block' border=1 id='his'>"],
				html;

			els.push(
				"<tr>" +
				"<td>#</td>" +
				"<td>Player</td>" +
				"<td>Finds</td>" +
				"<td>Kills</td>" +
				"<td>Deaths</td>" +
				"</tr>"
			);

			els.push(
				scores.map(function (s, i) {

					return "<tr>" +
						[
							i + 1,
							Network.getName(s.id),
							s.score,
							s.hits,
							s.deaths
						].map(function (d) {

							return "<td>" + d + "</td>";

						}).join("") +
						"</tr>";

				}).join("")
			);

			els.push("</table></div>");
			html = els.join("\n");

			document.querySelector("#roundWinner").innerHTML = html;
			// TODO: duplicated
			document.querySelector("#gameOverWin").innerHTML = html;


		}

	};

	window.WorldScreen = WorldScreen;

}());
