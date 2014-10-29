function MakeBox(w, d, h, col) {
	return Mesh = new THREE.Mesh(
		new THREE.BoxGeometry(w, d, h),
		new THREE.MeshLambertMaterial({ color: col || 0xff0000 }));
}

function msg(m) {
	var dom = document.querySelector("#watch"),
		args = Array.prototype.slice.call(arguments);
	dom.innerHTML = "";
	args.forEach(function (m, i) {
		dom.innerHTML += m + (i < args.length - 1 ? " : " : "");
	});
}

var urlParams = (function () {
	if (!window.location && !window.location.search) {
		return {};
	}
	var params = {},
		match,
		pl = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		query = window.location.search.substring(1);

	while (match = search.exec(query)) {
	   params[decode(match[1])] = decode(match[2]);
	}

	return params;
}());
