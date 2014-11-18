var WorldScreen = {

	scene: null,

	init: function (screen) {

		//this.scene = new THREE.Scene();
		this.scene = screen.scene;
		this.screen = screen;

		return this;
	},

	tick: function (dt) {

		// Do update ping
		this.screen.network.tick(this.screen.player.playerObj);

	}

};
