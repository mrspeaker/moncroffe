(function (utils) {

	"use strict";

	var PowerBalls = {

		bonuses: null;

		init: function () {

			this.bonuses = [];

			return this;

		},

		reset: function () {

			var meshToRemove = [];

			this.bonuses = this.bonuses.filter(function (b) {

				meshToRemove.push(b.mesh);
				return false;

			}, this);

			return meshToRemove;

		},

		add: function (pos, id) {

			// Add new powerball
			var bonus = Object.create(PowerBall).init();

			bonus.setPos(pos);
			bonus.id = id;
			this.bonuses.push(bonus);

			return this.scene.add(bonus.mesh);

		},

		tick: function (dt) {


		}

	};

	window.PowerBalls = PowerBalls;

}(
	window.utils
));
