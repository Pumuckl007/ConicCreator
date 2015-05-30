var cone = function(vars, cone){
  if(cone){

  }
  this.alpha = vars.alpha;
  this.l = vars.l;
  this.b = Math.cos(this.alpha)*this.l;
  this.h = Math.sqrt(Math.pow(this.l,2)-Math.pow(this.b,2));
}

var conic = function(cone, beta, height){
  this.cone = cone;
  this.height = height;
  this.m = Math.sin(this.cone.alpha)/(Math.cos(this.cone.alpha));
  this.u = Math.sin(beta)/(Math.cos(beta));
  this.v = height;
  this.x1 = this.v/(this.m-this.u);
  this.y1 = this.m*this.x1;
  this.x2 = this.v/(-this.m-this.u);
  this.y2 = -this.m*this.x2;
  this.a = Math.sqrt(Math.pow(this.x1-this.x2,2) + Math.pow(this.y1-this.y2,2))/2;
  this.e = Math.sin(beta)/Math.sin(this.cone.alpha);
  if(this.e>1){
    this.type = "hyperbola";
    this.b = this.m*this.a;
    this.equation = new hyperbola(this.a,this.b);
  } else if(this.e === 1){
    this.type = "perabola";
    if (this.x1 == Number.POSITIVE_INFINITY || this.x1 == Number.NEGATIVE_INFINITY){
      this.x1 = 0;
      this.y1 = this.v;
      this.a = Math.sqrt(Math.pow(this.x1-this.x2,2) + Math.pow(this.y1-this.y2,2))/2;
    } else {
      this.x2 = 0;
      this.y2 = this.v;
      this.a = Math.sqrt(Math.pow(this.x1-this.x2,2) + Math.pow(this.y1-this.y2,2))/2;
    }
    this.equation = new perabola(this.a);
  } else {
    this.type = "elipse";
    this.b = Math.cos(Math.asin(this.e))*this.a;
    this.c = Math.sqrt(this.a*this.a+this.b*this.b);
    this.equation = new elipse(this.a,this.b);
  }
}

var perabola = function(a){
  this.a = a;
  this.getY = function(x){
    return 1/(4*this.a)*Math.pow(x,2);
  }
  this.getX = function(y){
    var x1 = Math.sqrt(y/(1/(4*this.a)));
    var x2 = -x1;
    return [x1, x2];
  }
}

var elipse = function(a, b){
  this.a = a;
  this.b = b;
  this.c = Math.sqrt(a*a-b*b);
  this.getY = function(x){
    var y1 = Math.sqrt(b*b-(b*b*x*x)/(a*a));
    var y2 = -y1;
    return [y1, y2];
  }
  this.getX = function(y){
    var x1 = Math.sqrt(a*a-(a*a*y*y)/(b*b));
    var x2 = -x1;
    return [x1, x2];
  }
}

var hyperbola = function(a,b){
  this.a = a;
  this.b = b;
  this.c = Math.sqrt(a*a+b*b);
  this.getY = function(x){
    var y1 = Math.sqrt(-b*b+(b*b*x*x)/(a*a));
    var y2 = -y1;
    return [y1, y2];
  }
  this.getX = function(y){
    var x1 = Math.sqrt(a*a+(a*a*y*y)/(b*b));
    var x2 = -x1;
    return [x1, x2];
  }
}
