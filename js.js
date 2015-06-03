if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;

var camera, scene, renderer, valuesForConic;

var mesh;

init();
animate();

function init() {

  container = document.getElementById( 'container' );

  //

  camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 1, 3500 );
  // var width = window.innerWidth;
  // var height = window.innerHeight;
  // camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
  camera.position.z = 10;
  camera.position.y = -1;

  controls = new THREE.OrbitControls( camera );
	controls.damping = 0.2;
	controls.addEventListener( 'change', render );

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );

  valuesForConic = {alpha:45, beta:30, length: 10, height: -2, quality:100};

  var kone = new cone({alpha:valuesForConic.alpha*Math.PI/180, l:valuesForConic.length});
  var konic = new conic(kone, valuesForConic.beta*Math.PI/180, valuesForConic.height);
  window.konic = konic;
  var quality = valuesForConic.quality;
  var geom = genConicUpsideDown(konic,quality);
  var geom2 = genConic(konic,quality);
  var mat = new THREE.MeshPhongMaterial({
        // light
        specular: '#a9fcff',
        // intermediate
        color: '#00abb1',
        // dark
        emissive: '#006063',
        shininess: 20,
        wireframe: false
      });
  mat.side = THREE.DoubleSide;
  var mesh = new THREE.Mesh(geom, mat);
  var mesh2 = new THREE.Mesh(geom2, mat);
  window.cone1 = mesh;
  window.cone2 = mesh2;
  scene.add(mesh);
  scene.add(mesh2);
  var axes = buildAxes(200);
  scene.add(axes);

  document.addEventListener( 'mousemove', heMovedTheMouse, false );

  //

  // add subtle ambient lighting
  var ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);

  // directional lighting
  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(20, 20, -20).normalize();
  directionalLight.lookAt(1,3,3)
  scene.add(directionalLight);

  //

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setClearColor( scene.fog.color );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  container.appendChild( renderer.domElement );

  //

  window.addEventListener( 'resize', onWindowResize, false );

  var alpha = document.getElementById("alpha");
  var beta = document.getElementById("beta");
  var length = document.getElementById("length");
  var height = document.getElementById("height");
  var quality = document.getElementById("quality");
  alpha.onchange = onInputChange;
  beta.onchange = onInputChange;
  length.onchange = onInputChange;
  height.onchange = onInputChange;
  quality.onchange = onInputChange;

}

function onInputChange(event){
  valuesForConic[event.srcElement.id] = parseInt(event.srcElement.value);
  var kone = new cone({alpha:valuesForConic.alpha*Math.PI/180, l:valuesForConic.length});
  var konic = new conic(kone, valuesForConic.beta*Math.PI/180, valuesForConic.height);
  var quality = valuesForConic.quality;
  var geom = genConicUpsideDown(konic,quality);
  var geom2 = genConic(konic,quality);
  cone1.geometry = geom;
  cone2.geometry = geom2;
}

function heMovedTheMouse(event){
  controls.enabled = event.toElement.nodeName.toLowerCase() === 'canvas';
}

function buildAxes( length ) {
    var axes = new THREE.Object3D();

    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z

    return axes;
}

function buildAxis( src, dst, colorHex, dashed ) {
    var geom = new THREE.Geometry(),
        mat;

    if(dashed) {
            mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
    } else {
            mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
    }

    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );
    geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

    var axis = new THREE.Line( geom, mat, THREE.LinePieces );

    return axis;
}

function genConic(conic, widthSegments){
  var baseVertices = [];
  var upperVertices = [];
  var vertices = [];
  var faces = [];
  var p1 = new THREE.Vector3(10, conic.height, 1/conic.u);
  var p2 = new THREE.Vector3(2, conic.height-3, -3/conic.u);
  var p3 = new THREE.Vector3(-3, conic.height+2, 2/conic.u);
  var p1ane = new plane(p1, p2, p3);
  var jump = -1;
  var jumpVertex = 0;
  for(var i = 0; i<widthSegments; i++){
    var x = Math.cos(Math.PI*2/widthSegments*i)*conic.cone.b;
    var z = Math.sin(Math.PI*2/widthSegments*i)*conic.cone.b;
    var vertex = new THREE.Vector3(x, -conic.cone.h, z);
    var l1ne = new line(new THREE.Vector3(-vertex.x, -vertex.y, -vertex.z), vertex);
    var int = solveForIntersection(l1ne, p1ane);
    var skip = false;
    if(int.y < -conic.cone.h){
      skip = true;
      int = new THREE.Vector3(0,0,0);
    } else if(int.y > 0){
      skip = true;
    }
    if(!skip){
      var jumpVertexOld = jumpVertex;
      jumpVertex = baseVertices.push(vertices.push(vertex));
      upperVertices.push(vertices.push(int));
      if(jump != -1){
        jumpVertex = jumpVertexOld;
      }
    } else if(jump === -1){
      jump = i;
    }

  }
  for(var i = 0; i<baseVertices.length; i++){
    var max = baseVertices.length;
    if(jump != i+1){
      faces.push(new THREE.Face3(baseVertices[i%max]-1, baseVertices[i%max], baseVertices[(i+1)%max]-1));
      faces.push(new THREE.Face3(baseVertices[i%max], baseVertices[(i+1)%max]-1, baseVertices[(i+1)%max]));
    }
  }
  var first = jumpVertex-1;
  max = upperVertices.length;
  if(jump != -1 && conic.height < 0){
    var average = new THREE.Vector3(0,0,0);
    average.add(vertices[baseVertices[jumpVertex-1]-1]);
    average.add(vertices[baseVertices[jumpVertex]-1]);
    average.multiply(new THREE.Vector3(0.5,0.5,0.5));
    first = vertices.push(average)-1;
    var upVetClone = upperVertices.slice();
    while(upVetClone[0] != baseVertices[jumpVertex]-1){
      upVetClone.push(upVetClone.shift());
    }
    upVetClone.push(upVetClone.shift());
    for(var k = 0; k<upVetClone.length-1; k++){
      faces.push(new THREE.Face3(first, upVetClone[k]-1, upVetClone[k+1]-1));
    }
    faces.push(new THREE.Face3(first, upVetClone[upVetClone.length-1], upVetClone[upVetClone.length-1]+1))
    faces.push(new THREE.Face3(first, upVetClone[upVetClone.length-2], upVetClone[upVetClone.length-2]+1));
  } else {
    average = new THREE.Vector3(0,0,0);
    for(var i = 0; i<upperVertices.length; i++){
      var vertex = vertices[upperVertices[i]-1];
      average.add(vertex);
    }
    average.multiply(new THREE.Vector3(1/upperVertices.length, 1/upperVertices.length, 1/upperVertices.length));
    var averageIndex = vertices.push(average)-1;
    for(var i = 0; i<upperVertices.length; i++){
      var vertex = upperVertices[i]-1;
      var vertex2 = upperVertices[(i+1)%upperVertices.length]-1;
      var face = new THREE.Face3(vertex, vertex2, averageIndex);
      faces.push(face);
    }
  }
  var geom = new THREE.Geometry();
  geom.vertices = vertices;
  geom.faces = faces;
  for(var i = 0; i<faces.length; i++){
    var face = faces[i];
    var v1 = vertices[face.a];
    var v2 = vertices[face.b];
    var v3 = vertices[face.c];
    var u = v2.clone().sub(v1);
    var v = v3.clone().sub(v1);
    var normal = new THREE.Vector3(u.y*v.z-u.z*u.y, u.z*v.x-u.x*v.z, u.x*v.y-u.y*v.x);
    var facePlane = new plane(v1,v2,v3);
    if(!isPointOnSameSideOfPlaneAsNormal(new THREE.Vector3(0, -conic.cone.h, 0), facePlane)){
      normal.multiply(new THREE.Vector3(-1,-1,-1));
    }
    face.normal.copy(normal);
  }
  return geom;
}

//Upside Down

function genConicUpsideDown(conic, widthSegments){
  var baseVertices = [];
  var upperVertices = [];
  var vertices = [];
  var faces = [];
  var p1 = new THREE.Vector3(10, conic.height, 1/conic.u);
  var p2 = new THREE.Vector3(2, conic.height-3, -3/conic.u);
  var p3 = new THREE.Vector3(-3, conic.height+2, 2/conic.u);
  var p1ane = new plane(p1, p2, p3);
  var jump = -1;
  var jumpVertex = 0;
  for(var i = 0; i<widthSegments; i++){
    var x = Math.cos(Math.PI*2/widthSegments*i)*conic.cone.b;
    var z = Math.sin(Math.PI*2/widthSegments*i)*conic.cone.b;
    var vertex = new THREE.Vector3(x, conic.cone.h, z);
    var l1ne = new line(new THREE.Vector3(-vertex.x, -vertex.y, -vertex.z), vertex);
    var int = solveForIntersection(l1ne, p1ane);
    var skip = false;
    if(int.y > conic.cone.h){
      skip = true;
      int = new THREE.Vector3(0,0,0);
    } else if(int.y < 0){
      skip = true;
    }
    if(!skip){
      var jumpVertexOld = jumpVertex;
      jumpVertex = baseVertices.push(vertices.push(vertex));
      upperVertices.push(vertices.push(int));
      if(jump != -1){
        jumpVertex = jumpVertexOld;
      }
    } else if(jump === -1){
      jump = i;
    }

  }
  for(var i = 0; i<baseVertices.length; i++){
    var max = baseVertices.length;
    if(jump != i+1){
      faces.push(new THREE.Face3(baseVertices[i%max]-1, baseVertices[i%max], baseVertices[(i+1)%max]-1));
      faces.push(new THREE.Face3(baseVertices[i%max], baseVertices[(i+1)%max]-1, baseVertices[(i+1)%max]));
    }
  }
  var first = jumpVertex-1;
  max = upperVertices.length;
  if(jump != -1 && conic.height > 0){
    var average = new THREE.Vector3(0,0,0);
    average.add(vertices[baseVertices[jumpVertex-1]-1]);
    average.add(vertices[baseVertices[jumpVertex]-1]);
    average.multiply(new THREE.Vector3(0.5,0.5,0.5));
    first = vertices.push(average)-1;
    var upVetClone = upperVertices.slice();
    while(upVetClone[0] != baseVertices[jumpVertex]-1){
      upVetClone.push(upVetClone.shift());
    }
    upVetClone.push(upVetClone.shift());
    for(var k = 0; k<upVetClone.length-1; k++){
      faces.push(new THREE.Face3(first, upVetClone[k]-1, upVetClone[k+1]-1));
    }
    faces.push(new THREE.Face3(first, upVetClone[upVetClone.length-1], upVetClone[upVetClone.length-1]+1))
    faces.push(new THREE.Face3(first, upVetClone[upVetClone.length-2], upVetClone[upVetClone.length-2]+1));
  } else {
    average = new THREE.Vector3(0,0,0);
    for(var i = 0; i<upperVertices.length; i++){
      var vertex = vertices[upperVertices[i]-1];
      average.add(vertex);
    }
    average.multiply(new THREE.Vector3(1/upperVertices.length, 1/upperVertices.length, 1/upperVertices.length));
    var averageIndex = vertices.push(average)-1;
    for(var i = 0; i<upperVertices.length; i++){
      var vertex = upperVertices[i]-1;
      var vertex2 = upperVertices[(i+1)%upperVertices.length]-1;
      var face = new THREE.Face3(vertex, vertex2, averageIndex);
      faces.push(face);
    }
  }
  var geom = new THREE.Geometry();
  geom.vertices = vertices;
  geom.faces = faces;
  var baseAverage = new THREE.Vector3(0,0,0);
  for(var i = 0; i<baseVertices.length; i++){
    baseAverage.add(vertices[baseVertices[i]-1]);
  }
  baseAverage.multiply(new THREE.Vector3(1/baseVertices.length,1/baseVertices.length,1/baseVertices.length));
  for(var i = 0; i<faces.length; i++){
    var face = faces[i];
    var v1 = vertices[face.a];
    var v2 = vertices[face.b];
    var v3 = vertices[face.c];
    var u = v2.clone().sub(v1);
    var v = v3.clone().sub(v1);
    var normal = new THREE.Vector3(u.y*v.z-u.z*u.y, u.z*v.x-u.x*v.z, u.x*v.y-u.y*v.x);
    var facePlane = new plane(v1,v2,v3);
    if(isPointOnSameSideOfPlaneAsNormal(baseAverage, facePlane)){
      normal.multiply(new THREE.Vector3(-1,-1,-1));
    }
    face.normal.copy(normal);
  }
  return geom;
}

function isPointOnSameSideOfPlaneAsNormal(point, plane){
  var v1 = plane.p1;
  var v2 = plane.p2;
  var v3 = plane.p3;
  var u = v2.clone().sub(v1);
  var v = v3.clone().sub(v1);
  var normal = new THREE.Vector3(u.y*v.z-u.z*u.y, u.z*v.x-u.x*v.z, u.x*v.y-u.y*v.x);
  return point.clone().dot(normal) > 0;
}

function plane(point1, point2, point3){
  this.p1 = point1;
  this.p2 = point2;
  this.p3 = point3;
  var e = this.p1.x;
  var f = this.p1.y;
  var g = this.p1.z;
  var t = this.p2.x;
  var v = this.p2.y;
  var w = this.p2.z;
  var q = this.p3.x;
  var r = this.p3.y;
  var s = this.p3.z;
  this.c = (-s*t+s*e+g*t-e*w-q*g+q*w)/(-e*v+f*t+q*v-q*f-r*t+r*e);
  this.b = (g+this.c*v-this.c*f-w)/(-t+e);
  this.a = g-this.b*e-this.c*f;
}

function line(direction, origin){
  if(!(origin)){
    origin = new THREE.Vector3(0,0,0);
  }
  this.a = origin.x;
  this.b = origin.y;
  this.c = origin.z;
  this.e = direction.x;
  this.f = direction.y;
  this.g = direction.z;
}

function solveForIntersection(line, plane){
  var a = line.a;
  var b = line.b;
  var c = line.c;
  var e = line.e;
  var f = line.f;
  var g = line.g;
  var h = plane.a;
  var i = plane.b;
  var j = plane.c;
  var t = (c-h-i*a-j*b)/(i*e+j*f-g);
  var x = a+t*e;
  var y = b+t*f;
  var z = c+t*g;
  return new THREE.Vector3(x,y,z);
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

  requestAnimationFrame( animate );

  render();

}

function render() {

  renderer.render( scene, camera );

}
