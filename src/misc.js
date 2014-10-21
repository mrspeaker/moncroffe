function MakeBox(w, d, h, col) {
	return Mesh = new THREE.Mesh(
		new THREE.BoxGeometry(w, d, h), 
		new THREE.MeshLambertMaterial({ color: col || 0xff0000 }));
}

function msg(m) {
	document.querySelector("#watch").innerHTML = m;
}