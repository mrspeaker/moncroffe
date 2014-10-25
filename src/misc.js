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