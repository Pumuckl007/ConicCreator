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

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );

  var kone = new cone({alpha:Math.PI/4, l:3});
  var konic = new conic(kone, Math.PI/3, -1);
  var geom = genConic(konic,10);
  console.log(geom);
  // geom = new THREE.CylinderGeometry(2,2,3,20);
  var mat = new THREE.MeshBasicMaterial(0xFFAA00);
  var mesh = new THREE.Mesh(geom, mat);
  scene.add(mesh);

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

function genConic(conic, widthSegments){
  var baseVertices = [];
  var vertices = [];
  var faces = [];
  switch (conic.type){
    case "hyperbola":
      for(var i = 0; i<widthSegments; i++){
        var x = Math.cos(Math.PI*2/widthSegments*i)*conic.cone.d/2;
        var z = Math.sin(Math.PI*2/widthSegments*i)*conic.cone.d/2;
        var vertex = new THREE.Vector3(x, -conic.cone.h, z);
        baseVertices.push(vertices.push(vertex));
        var m1 = -conic.cone.h/z;
        var m2 = -conic.cone.h/x;
        var xInt = conic.height/(m1-conic.m);
        var zInt = m1*xInt;
        var yInt = m2*xInt;
        if(yInt <= -conic.cone.height || yInt >= 0){
          vertices.push(new THREE.Vector3(0,0,0));
        } else {
          vertices.push(new THREE.Vector3(xInt, yInt, zInt));
        }
      }
      for(var i = 0; i<widthSegments-1; i++){
        faces.push(new THREE.Face3(baseVertices[i]-1, baseVertices[i], baseVertices[i+1]-1));
        faces.push(new THREE.Face3(baseVertices[i], baseVertices[i+1]-1, baseVertices[i+1]));
      }
      break;
    case "perabola":
      console.log(conic);
      console.log("per");
      break;
    default:
      console.log("default");
  }
  var geom = new THREE.Geometry();
  geom.vertices = vertices;
  geom.faces = faces;
  geom.computeVertexNormals()
  geom.computeFaceNormals()
  return geom;
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
