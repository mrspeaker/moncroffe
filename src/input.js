(function () {

	var input = {
		init: function () {
			this.bindHandlers();
		},

		bindHandlers: function () {
			window.addEventListener("keydown", onKeyDown, false);

			function onKeyDown(e) {
				console.log("wat", e.keyCode);
			}
		},

		tick: function () {

		}
	};

	window.input = input;
}());