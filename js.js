if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, scene, renderer;

var mesh;

init();
animate();

function init() {

  container = document.getElementById( 'container' );

  //

  camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 1, 3500 );
  camera.position.z = 10;
  camera.position.y = -1;

  controls = new THREE.OrbitControls( camera );
	controls.damping = 0.2;
	controls.addEventListener( 'change', render );

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );

  var kone = new cone({alpha:Math.PI/10, l:30});
  var konic = new conic(kone, Math.PI/30, -5);
  window.konic = konic;
  var geom = genConic(konic,1000);
  console.log(geom);
  var mat = new THREE.MeshPhongMaterial({
        // light
        specular: '#a9fcff',
        // intermediate
        color: '#00abb1',
        // dark
        emissive: '#006063',
        shininess: 100
      });
  mat.side = THREE.DoubleSide;
  var mesh = new THREE.Mesh(geom, mat);
  window.mesh = mesh;
  scene.add(mesh);
  var axes = buildAxes(20);
  scene.add(axes);

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

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );

  //

  window.addEventListener( 'resize', onWindowResize, false );

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
    var vertexX = 0;
    var vertexY = -Math.sin(conic.beta)*conic.a;
    var vertexZ = -Math.cos(conic.beta)*conic.a;
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
      baseVertices.push(vertices.push(vertex));
      upperVertices.push(vertices.push(int));
    } else if(jump === -1){
      jump = i;
      jumpVertex = i*2-1;
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
  if(jump != -1){
    for(var k = 0; k<upperVertices.length; k++){
      if(upperVertices[(k+1)%max]-1 === upperVertices[max-1]-1){

      } else {
        faces.push(new THREE.Face3(first, upperVertices[(k)%max]-1, upperVertices[(k+1)%max]-1));
      }
    }
    faces.push(new THREE.Face3(first, upperVertices[upperVertices.length-1]-1, upperVertices[upperVertices.length-1]-2))
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
  stats.update();

}

function render() {

  renderer.render( scene, camera );

}
