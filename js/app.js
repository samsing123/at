/**
 * @author mrdoob / http://mrdoob.com/
 */



var APP = {

	Player: function () {

		var scope = this;

		var loader = new THREE.ObjectLoader();
		var camera, scene, renderer;

		var controls, effect, cameraVR, isVR,options, spawnerOptions, particleSystem;
		var clock = new THREE.Clock(true);
		var tick = 0;
		var particles = [];
		var particlesTween = [];

		var events = {};

		this.dom = document.createElement( 'div' );

		this.width = 500;
		this.height = 500;

		function MultiTween(objects) {
		  var _tweens = [];
		  objects.forEach(function(object) {
		    _tweens.push(new TWEEN.Tween(object));
		  });

		  this.to = function(destination, duration) {
		    _tweens.forEach(function(tween) {
		      tween.to(destination, duration);
		    });
		  };

		  this.easing = function(easing) {
		    _tweens.forEach(function(tween) {
		      tween.easing(easing);
		    });
		  };

		  this.start = function() {
		    _tweens.forEach(function(tween) {
		      tween.start();
		    });
		  };
		}

		this.load = function ( json ) {

			isVR = json.project.vr;

			renderer = new THREE.WebGLRenderer( { antialias: true } );
			renderer.setClearColor( 0x000000 );
			renderer.setPixelRatio( window.devicePixelRatio );

			if ( json.project.gammaInput ) renderer.gammaInput = true;
			if ( json.project.gammaOutput ) renderer.gammaOutput = true;

			if ( json.project.shadows ) {

				renderer.shadowMap.enabled = true;
				// renderer.shadowMap.type = THREE.PCFSoftShadowMap;

			}

			this.dom.appendChild( renderer.domElement );

			this.setScene( loader.parse( json.scene ) );
			this.setCamera( loader.parse( json.camera ) );

			events = {
				init: [],
				start: [],
				stop: [],
				keydown: [],
				keyup: [],
				mousedown: [],
				mouseup: [],
				mousemove: [],
				touchstart: [],
				touchend: [],
				touchmove: [],
				update: []
			};
			

			var scriptWrapParams = 'player,renderer,scene,camera';
			var scriptWrapResultObj = {};

			for ( var eventKey in events ) {

				scriptWrapParams += ',' + eventKey;
				scriptWrapResultObj[ eventKey ] = eventKey;

			}

			var scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, '' );

			for ( var uuid in json.scripts ) {

				var object = scene.getObjectByProperty( 'uuid', uuid, true );

				if ( object === undefined ) {

					console.warn( 'APP.Player: Script without object.', uuid );
					continue;

				}

				var scripts = json.scripts[ uuid ];

				for ( var i = 0; i < scripts.length; i ++ ) {

					var script = scripts[ i ];

					var functions = ( new Function( scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';' ).bind( object ) )( this, renderer, scene, camera );

					for ( var name in functions ) {

						if ( functions[ name ] === undefined ) continue;

						if ( events[ name ] === undefined ) {

							console.warn( 'APP.Player: Event type not supported (', name, ')' );
							continue;

						}

						events[ name ].push( functions[ name ].bind( object ) );

					}

				}

			}

			// new THREE.FontLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/droid_sans_bold.typeface.js', function(font) {

			// 	var textAnimationData = createTextAnimation(font);

			// 	var group = new THREE.Group();
			// 	scene.add(group);

			// 	var textAnimation = new TextAnimation(textAnimationData);
			// 	group.add(textAnimation);

			// 	var explosionAnimation = new ExplosionAnimation(textAnimationData);
			// 	group.add(explosionAnimation);

			// 	var box = textAnimationData.geometry.boundingBox;
			// 	group.position.copy(box.size()).multiplyScalar(-0.5);

			// 	var light = new THREE.DirectionalLight(0xffffff, 1.0);
			// 	light.position.set(0, 0, 1);
			// 	//scene.add(light);

			// 	var lightTl = new TimelineMax();

			// 	var maxTime = Math.max(textAnimation.animationDuration, explosionAnimation.animationDuration);
			// 	var duration = 6.0;

			// 	for (var i = 0; i < textAnimationData.info.length; i++) {
			// 		var color = textAnimationData.info[i].color;
			// 		var pos = textAnimationData.info[i].boundingBox.center();

			// 		pos.x += textAnimationData.info[i].glyphOffset;

			// 		light = new THREE.PointLight(color, 2.0, 80, 2);
			// 		light.position.copy(pos);

			// 		group.add(light);

			// 		lightTl.fromTo(light, 0.4, {
			// 				intensity: 0
			// 			}, {
			// 				intensity: 4.0,
			// 				repeat: 1,
			// 				yoyo: true
			// 			},
			// 			(i * settings.letterTimeOffset) * (duration / maxTime));
			// 	}

			// 	var tl = new TimelineMax({
			// 		repeat: -1,
			// 		repeatDelay: 0.5,
			// 		yoyo: true
			// 	});
			// 	tl.to(textAnimation, duration, {
			// 		time: maxTime,
			// 		ease: Power0.easeIn
			// 	}, 0);
			// 	tl.to(explosionAnimation, duration, {
			// 		time: maxTime,
			// 		ease: Power0.easeIn
			// 	}, 0);
			// 	tl.add(lightTl, 0);

			// 	// tl.timeScale(0.1)

			// 	createTweenScrubber(tl);
			// });
			/*
			var geometry = new THREE.Geometry();
	        geometry.vertices.push(new THREE.Vector3(-2, -2, 1));
	        geometry.vertices.push(new THREE.Vector3(-2, 0, -3));
	        var material = new THREE.LineBasicMaterial({
	            color: 0xffffff
	        });
			var line = new THREE.Line(geometry, material);
			line.translateZ(2);
			scene.add(line);
			*/
			
			//for generating the line of light
			//but having some bug to produce the same effect as layout
			//TODO: rotating the line to facing the source of light
			//TODO2:make a line with a map of two blur
			//TODO3:make mutiple line move(tween)
			//TODO4:keep generating the line when the page is opening
			//makeParticles(); 


			particleSystem = new THREE.GPUParticleSystem({
				maxParticles: 10000
			});
			scene.add( particleSystem);


			// options passed during each spawned
			options = {
				position: new THREE.Vector3(0,0,0),
				positionRandomness: .3,
				velocity: new THREE.Vector3(),
				velocityRandomness: 1,
				color: 0xaa88ff,
				colorRandomness: .2,
				turbulence: 0,
				lifetime: 5,
				size: 4,
				sizeRandomness: .2
			};
			spawnerOptions = {
				spawnRate: 8000,
				horizontalSpeed: 0,
				verticalSpeed: 0,
				timeScale: 0.4
			}

			dispatch( events.init, arguments );

		};

		this.setCamera = function ( value ) {

			camera = value;
			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();

			if ( isVR === true ) {

				cameraVR = new THREE.PerspectiveCamera();
				cameraVR.projectionMatrix = camera.projectionMatrix;
				camera.add( cameraVR );

				controls = new THREE.VRControls( cameraVR );
				effect = new THREE.VREffect( renderer );

				if ( WEBVR.isAvailable() === true ) {

					this.dom.appendChild( WEBVR.getButton( effect ) );

				}

				if ( WEBVR.isLatestAvailable() === false ) {

					this.dom.appendChild( WEBVR.getMessage() );

				}

			}

		};

		this.setScene = function ( value ) {

			scene = value;

		};

		this.setSize = function ( width, height ) {

			this.width = width;
			this.height = height;

			if ( camera ) {

				camera.aspect = this.width / this.height;
				camera.updateProjectionMatrix();

			}

			if ( renderer ) {

				renderer.setSize( width, height );

			}

		};

		function dispatch( array, event ) {

			for ( var i = 0, l = array.length; i < l; i ++ ) {

				array[ i ]( event );

			}

		}
		function makeParticles() { 
		 
			// we're gonna move from z position -1000 (far away) 
			// to 1000 (where the camera is) and add a random particle at every pos. 
			for ( var zpos= 0; zpos < 5; zpos++ ) {
		 
				// we make a particle material and pass through the 
				// colour and custom particle render function we defined. 
				var map = new THREE.TextureLoader().load( "line_01.png" );
                var material = new THREE.SpriteMaterial( { color: 0xffffff, fog: false } );
				//material = new THREE.SpriteMaterial( { color: 0xffffff } );
				// make the particle
				var sprite = new THREE.Sprite(material);
		 
				// give it a random x and y position between -500 and 500
				sprite.position.x = Math.random() * 10 - 5;
				sprite.position.y = Math.random() * 10 - 5;
		 
				// set its z position
				sprite.position.z = 1;
		 
				// scale it up a bit
				sprite.scale.x = 0.005;
				sprite.scale.y = 1;
		 
				// add it to the scene
				var updateCallback = function() {
					sprite.position.x = this.x;
				    sprite.position.y = this.y;
				    sprite.scale.y = this.y;
				}
				var coords = { x: sprite.position.x, y: sprite.position.y  };
				var tween = new TWEEN.Tween(coords)
				    .to({ x: 0, y: 0 }, 5000)
				    .onUpdate(updateCallback)
				    .start();
				console.log('sprite '+zpos+':'+coords.x+','+coords.y);

				particlesTween.push(coords);

				scene.add( sprite );
				// and to the array of particles. 
				particles.push(sprite);
				
			}
			var objs =  particlesTween;
			var target = { x: 0, y: 0 };
				//particlesTween.push(tween);
		}
		
		function particleRender( context ) {
				
			// we get passed a reference to the canvas context
			context.beginPath();
			// and we just have to draw our shape at 0,0 - in this
			// case an arc from 0 to 2Pi radians or 360º - a full circle!
			context.arc( 0, 0, 1, 0,  Math.PI * 2, true );
			context.fill();
		};
		function updateParticles(time) { 
				
			// iterate through every particle
			for(var i=0; i<particles.length; i++) {
	
				particle = particles[i]; 
	
				// and move it forward dependent on the mouseY position. 
				//particle.position.z +=  mouseY * 0.1;
	
				// if the particle is too close move it to the back
				//if(particle.position.z>=-1) particle.position.z-=0.01;
				
			}

		}

		var prevTime, request;

		function animate( time ) {

			request = requestAnimationFrame( animate );
			//TWEEN.update();
			
			if(false){//time/1000>=30 && time/1000<=30.5
				var delta = clock.getDelta() * spawnerOptions.timeScale;
				tick += delta;
				if (tick < 0) tick = 0;
				if (delta > 0) {
					var radius = 1;
					var tempPosArr = randomSpherePoint(options.position.x,options.position.y,options.position.z,radius);
					options.velocity.x = tempPosArr[0];
					options.velocity.y = tempPosArr[1];
					options.velocity.z = tempPosArr[2];
					options.size = Math.floor((Math.random() * 6) + 3);
					for (var x = 0; x < spawnerOptions.spawnRate * delta; x++) {
						particleSystem.spawnParticle(options);
						
					}
				}
				particleSystem.update(tick);
			}

			

			try {

				dispatch( events.update, { time: time, delta: time - prevTime } );

			} catch ( e ) {

				console.error( ( e.message || e ), ( e.stack || "" ) );

			}

			if ( isVR === true ) {

				camera.updateMatrixWorld();

				controls.update();
				effect.render( scene, cameraVR );

			} else {

				renderer.render( scene, camera );

			}
			updateParticles(time);

			prevTime = time;
		}

		function randomSpherePoint(x0,y0,z0,radius){
		   var u = Math.random();
		   var v = Math.random();
		   var theta = 2 * Math.PI * u;
		   var phi = Math.acos(2 * v - 1);
		   var x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
		   var y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
		   var z = z0 + (radius * Math.cos(phi));
		   return [x,y,z];
		}

		this.play = function () {

			document.addEventListener( 'keydown', onDocumentKeyDown );
			document.addEventListener( 'keyup', onDocumentKeyUp );
			document.addEventListener( 'mousedown', onDocumentMouseDown );
			document.addEventListener( 'mouseup', onDocumentMouseUp );
			document.addEventListener( 'mousemove', onDocumentMouseMove );
			document.addEventListener( 'touchstart', onDocumentTouchStart );
			document.addEventListener( 'touchend', onDocumentTouchEnd );
			document.addEventListener( 'touchmove', onDocumentTouchMove );

			dispatch( events.start, arguments );

			request = requestAnimationFrame( animate );
			prevTime = performance.now();

		};

		this.stop = function () {

			document.removeEventListener( 'keydown', onDocumentKeyDown );
			document.removeEventListener( 'keyup', onDocumentKeyUp );
			document.removeEventListener( 'mousedown', onDocumentMouseDown );
			document.removeEventListener( 'mouseup', onDocumentMouseUp );
			document.removeEventListener( 'mousemove', onDocumentMouseMove );
			document.removeEventListener( 'touchstart', onDocumentTouchStart );
			document.removeEventListener( 'touchend', onDocumentTouchEnd );
			document.removeEventListener( 'touchmove', onDocumentTouchMove );

			dispatch( events.stop, arguments );

			cancelAnimationFrame( request );

		};

		this.dispose = function () {

			while ( this.dom.children.length ) {

				this.dom.removeChild( this.dom.firstChild );

			}

			renderer.dispose();

			camera = undefined;
			scene = undefined;
			renderer = undefined;

		};

		//

		function onDocumentKeyDown( event ) {

			dispatch( events.keydown, event );

		}

		function onDocumentKeyUp( event ) {

			dispatch( events.keyup, event );

		}

		function onDocumentMouseDown( event ) {

			dispatch( events.mousedown, event );

		}

		function onDocumentMouseUp( event ) {

			dispatch( events.mouseup, event );

		}

		function onDocumentMouseMove( event ) {

			dispatch( events.mousemove, event );

		}

		function onDocumentTouchStart( event ) {

			dispatch( events.touchstart, event );

		}

		function onDocumentTouchEnd( event ) {

			dispatch( events.touchend, event );

		}

		function onDocumentTouchMove( event ) {

			dispatch( events.touchmove, event );

		}

	}

};
