(function () {

	"use strict";

	var Particles = {},
		group = new THREE.Group(),
		i,
		attributes,
		texture,
		uniforms,
		particleCloud,
		aaa;

	window.Particles = Particles;

	// Create particle objects for Three.js

	var particlesLength = 5000;

	var particles = new THREE.Geometry();

	function newpos( x, y, z ) {

		return new THREE.Vector3( x, y, z );

	}


	var Pool = {

		__pools: [],

		// Get a new Vector

		get: function() {

			if ( this.__pools.length > 0 ) {

				return this.__pools.pop();

			}

			console.log( "pool ran out!" )
			return null;

		},

		// Release a vector back into the pool

		add: function( v ) {

			this.__pools.push( v );

		}

	};


	for ( i = 0; i < particlesLength; i ++ ) {

		var p = randomSpherePoint(1.4);

		particles.vertices.push(
			/*newpos(
				Math.random() * 0.2 - 0.1,
				Math.random() * 0.2 - 0.1,
				Math.random() * 0.2 - 0.1 ) );*/
			newpos(
				p[0],
				p[1],
				p[2]
			));
		Pool.add( i );

	}


	// Create pools of vectors

	attributes = {

		size:  { type: 'f', value: [] },
		pcolor: { type: 'c', value: [] }

	};

	var sprite = generateSprite() ;

	texture = new THREE.Texture( sprite );
	texture.needsUpdate = true;

	uniforms = {

		texture: { type: "t", value: texture }

	};

	// PARAMETERS

	// Steadycounter
	// Life
	// Opacity
	// Hue Speed
	// Movement Speed

	function generateSprite() {

		var canvas = document.createElement( 'canvas' );
		canvas.width = 128;
		canvas.height = 128;

		var context = canvas.getContext( '2d' );

		context.beginPath();
		context.arc( 64, 64, 60, 0, Math.PI * 2, false) ;

		context.lineWidth = 0.5; //0.05
		context.stroke();
		context.restore();

		var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );

		gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
		gradient.addColorStop( 0.2, 'rgba(255,255,255,1)' );
		gradient.addColorStop( 0.4, 'rgba(200,200,200,1)' );
		gradient.addColorStop( 1, 'rgba(0,0,0,1)' );

		context.fillStyle = gradient;

		context.fill();

		return canvas;

	}


	var shaderMaterial = new THREE.ShaderMaterial( {

		uniforms: uniforms,
		attributes: attributes,

		vertexShader: document.getElementById( 'vParticles' ).textContent,
		fragmentShader: document.getElementById( 'fParticles' ).textContent,

		blending: THREE.AdditiveBlending,
		depthWrite: false,
		transparent: true

	});

	particleCloud = new THREE.PointCloud( particles, shaderMaterial );

	particleCloud.dynamic = true;

	var vertices = particleCloud.geometry.vertices;
	var values_size = attributes.size.value;
	var values_color = attributes.pcolor.value;

	for( var v = 0; v < vertices.length; v ++ ) {

		values_size[ v ] = 0.05;

		values_color[ v ] = new THREE.Color( 0x2EA469 ).lerp(new THREE.Color(0x2EA4D9), Math.random());

		//particles.vertices[ v ].set( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );


	}

	particleCloud.geometry.verticesNeedUpdate = true;
	Particles.particleCloud = particleCloud;

	group.add( particleCloud );
	particleCloud.position.set(0, 0, 0);

	var setTargetParticle = function() {

		var target = Pool.get();
		values_size[ target ] = Math.random() * 50 + 10;

		return target;

	};

	function randomSpherePoint(radius){
		var u = Math.random();
		var v = Math.random();
		var theta = 2 * Math.PI * u;
		var phi = Math.acos(2 * v - 1);
		var x = radius * Math.sin(phi) * Math.cos(theta);
		var y = radius * Math.sin(phi) * Math.sin(theta);
		var z = radius * Math.cos(phi);
		return [x, y, z];
	}


	Particles.group = group;

}());
