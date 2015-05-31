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

  var kone = new cone({alpha:Math.PI/4, l:3});
  var konic = new conic(kone, Math.PI/3, -1);
  window.konic = konic;
  var geom = genConic(konic,30);
  console.log(geom);
  // geom = new THREE.CylinderGeometry(2,2,3,20);
  var mat = new THREE.MeshBasicMaterial({color: 0xFFAA00, wireframe:false});
  mat.side = THREE.DoubleSide;
  var mesh = new THREE.Mesh(geom, mat);
  window.mesh = mesh;
  scene.add(mesh);
  var matPlane = new THREE.MeshBasicMaterial({color: 0x0000FF, wireframe:true});
  var geomPlane = new THREE.PlaneGeometry(5,5,10,10);
  var meshPlane = new THREE.Mesh(geomPlane, matPlane);
  meshPlane.rotation.x = (Math.PI/2-Math.PI/3);
  meshPlane.position.set(0,-1,0)
  scene.add(meshPlane);
  window.plane = meshPlane;
  var axes = buildAxes(20);
  scene.add(axes);
  var cylender = new THREE.CylinderGeometry(0.2,0.2,0.1, 50, 1, true);
  var cylenderMat = new THREE.MeshBasicMaterial({color: 0x00AAFF, wireframe:true});
  var cylenderMesh = new THREE.Mesh(cylender, cylenderMat);
  cylenderMesh.position.set(geom.vertices[0].x,geom.vertices[0].y, geom.vertices[0].z);
  scene.add(cylenderMesh);

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
  var nonIntersetctingVerts = [];
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
    }

  }
  for(var i = 0; i<widthSegments; i++){
    var max = baseVertices.length;
    faces.push(new THREE.Face3(baseVertices[i%max]-1, baseVertices[i%max], baseVertices[(i+1)%max]-1));
    faces.push(new THREE.Face3(baseVertices[i%max], baseVertices[(i+1)%max]-1, baseVertices[(i+1)%max]));
  }
  var geom = new THREE.Geometry();
  geom.vertices = vertices;
  geom.faces = faces;
  geom.computeVertexNormals()
  geom.computeFaceNormals()
  return geom;
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

// function genConic(conic, widthSegments){
//   var baseVertices = [];
//   var upperVertices = [];
//   var vertices = [];
//   var faces = [];
//   var nonIntersetctingVerts = [];
//   switch (conic.type){
//     case "hyperbola":
//       for(var i = 0; i<widthSegments; i++){
//         var x = Math.cos(Math.PI*2/widthSegments*i)*conic.cone.b;
//         var z = Math.sin(Math.PI*2/widthSegments*i)*conic.cone.b;
//         var vertex = new THREE.Vector3(x, -conic.cone.h, z);
//         baseVertices.push(vertices.push(vertex));
//         var m1 = conic.cone.h/z;
//         var m2 = -conic.cone.h/x;
//         var xInt = conic.height/(m1-conic.u);
//         var zInt = m1*xInt;
//         var yInt = m2*xInt;
//         if(m1 == Number.POSITIVE_INFINITY || m1 == Number.NEGATIVE_INFINITY){
//           yInt = conic.height;
//           xInt = (yInt - conic.height)/conic.u;
//           zInt = 0;
//         }
//         if(yInt <= -conic.cone.h || yInt >= 0 || Math.abs(xInt) > conic.cone.b || Math.abs(zInt) > conic.cone.b){
//         console.log(baseVertices[baseVertices.length-1]-1);
//         console.log("x: " + x);
//         console.log("z: " + z);
//         console.log("m1: " + m1);
//         console.log("conic.h: " + conic.cone.h);
//         console.log("m2: " + m2);
//         console.log("conic.u: " + conic.u);
//         console.log("xInt: " + xInt);
//         console.log("yInt: " + yInt);
//         console.log("zInt: " + zInt);
//           vertices.push(new THREE.Vector3(0,0,0));
//         } else {
//           vertices.push(new THREE.Vector3(xInt, yInt, zInt));
//         }
//       }
//       for(var i = 0; i<widthSegments; i++){
//         var max = baseVertices.length;
//         faces.push(new THREE.Face3(baseVertices[i%max]-1, baseVertices[i%max], baseVertices[(i+1)%max]-1));
//         faces.push(new THREE.Face3(baseVertices[i%max], baseVertices[(i+1)%max]-1, baseVertices[(i+1)%max]));
//       }
//       break;
//     case "perabola":
//       console.log(conic);
//       console.log("per");
//       break;
//     default:
//       console.log("default");
//   }
//   var geom = new THREE.Geometry();
//   geom.vertices = vertices;
//   geom.faces = faces;
//   geom.computeVertexNormals()
//   geom.computeFaceNormals()
//   return geom;
// }
