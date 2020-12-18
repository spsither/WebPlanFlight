function generatePath() {
    
    const latLngs = selectedShape.getPath()
    let boundingPolygon = new Polygon().setPointsFromLatLng(latLngs)
    boundingPolygon.print('bounding polygon')
    boundingPolygon.getLongestEdge().print('longest edge of bounding polygon')
    // const height = prompt(`Enter Drone Flight height:`)
    // console.log(height)
    let longestEdge = boundingPolygon.getLongestEdge()
    //longestEdge.draw()

    let sweep = boundingPolygon.getSweepLine()
    sweep.print('sweep')
    sweep.draw()
    
    let intervals = sweep.getIntervalPoints(10)    
    
    const raySlope = Math.tan((sweep.getAngle()+90)*Math.PI/180)
    console.log(`ray angle is : ${Math.atan(raySlope)*180/Math.PI}`)
    let rays = intervals.map(x=>new Ray(x, raySlope))
    console.log(rays)
    let rayLines = rays.map(x=>boundingPolygon.getRayIntersectLine(x))
    console.log(rayLines)
    rayLines.forEach(x=>x.draw())
}


class Point{
    constructor(x,y){
        this.x = x
        this.y = y
    }
    print(name = ''){
        console.log(`point ${name}: (${this.x}, ${this.y})`)
    }
    isOn(line){
        if((this.x == line.pointA.x && this.y == line.pointA.y) || (this.x == line.pointB.x && this.y == line.pointB.y)){
            return true
        }
        if (line.getSlope() != (this.y - line.pointA.y) / (this.x - line.pointA.x)){
            return false
        }
        else {
            const xMin = Math.min(line.pointA.x, line.pointB.x)
            const xMax = Math.max(line.pointA.x, line.pointB.x)
            const yMin = Math.min(line.pointA.y, line.pointB.y)
            const yMax = Math.max(line.pointA.y, line.pointB.y)
            if (this.x >= xMin && this.x <= xMax && this.y >= yMin && this.y <= yMax){
                return true
            }
            else 
                return false
        }

        
    }
    
}
class Ray{
    constructor(point, slope){
        this.point = point
        this.slope = slope
    }
    doesIntersect(line){
        let inPt = this.getIntersectPoint(line)
        return Boolean(inPt) && inPt.isOn(line)
    } 
    getIntersectPoint(line, segment = false){        
        if (line.getSlope() == this.slope ){
            return null
        }
        const rC = this.point.y - this.slope*this.point.x  
        const lC = line.pointA.y - line.getSlope() * line.pointA.x

        let ans = new Point((lC-rC)/ (this.slope - line.getSlope()), (lC*this.slope - rC*line.getSlope())/(this.slope - line.getSlope()))
        
        if(!segment){
            return ans    
        }
        else{
            // const xMin = Math.min(line.pointA.x, line.pointB.x)
            // const xMax = Math.max(line.pointA.x, line.pointB.x)
            // const yMin = Math.min(line.pointA.y, line.pointB.y)
            // const yMax = Math.max(line.pointA.y, line.pointB.y)
            
            // if (ans.x >= xMin && ans.x <= xMax && ans.y >= yMin && ans.y <= yMax){
            //     return ans
            // }
            // else 
            //     return null
            // }
            let a = new Line(this.point, line.pointA)
            let b = new Line(this.point, line.pointB)
            let n = this.getAngle() - 90
            let sign1 = Math.sign(Math.cos((a.getAngle() - n ) * Math.PI / 180))
            let sign2 = Math.sign(Math.cos((b.getAngle() - n ) * Math.PI / 180))
            console.log(sign1,sign2)
            if(sign1 != sign2){
                return ans
            }
            else{
                return null
            }
            
         } 
    }   
    getAngle(){
        return Math.atan(this.slope) * 180/Math.PI 
    }
}
class Line {
    constructor(pointA, pointB) {
      this.pointA = pointA;
      this.pointB = pointB;
    }
    getLength() {
        let dxAB = this.pointA.x - this.pointB.x
        let dyAB = this.pointA.y - this.pointB.y
        return Math.sqrt(dxAB**2+dyAB**2)
    }
    getAngle(){
        return (Math.atan2(this.pointB.y - this.pointA.y, this.pointB.x - this.pointA.x))*180/Math.PI;
    }

    getIntervalPoints(n){     
        var dxAB = this.pointB.x - this.pointA.x
        var dyAB = this.pointB.y - this.pointA.y
        const strideX = dxAB/n
        const strideY = dyAB/n
        let intervalPoints = []
        for(let i = 1; i < n-1; i++){
            let pt = new Point(this.pointA.x + strideX*i, this.pointA.y + strideY*i)
            intervalPoints.push(pt)
        }
        return intervalPoints
    }
    getDistanceToPoint(point){
        let d = Math.abs((this.pointB.x-this.pointA.x)*(this.pointA.y - point.y) - (this.pointA.x - point.x)*(this.pointB.y - this.pointA.y))
        return d/this.getLength()
    }
    draw(){
          const flightPath = new google.maps.Polyline({
            path: this.getLatLng(),
            geodesic: true,
            strokeColor: "#00FF00",
            strokeOpacity: 1.0,
            strokeWeight: 2,
          });
          flightPath.setMap(map);
    }
    getLatLng(){
        let latLngs = []
        latLngs.push(map.getProjection().fromPointToLatLng(this.pointA))
        latLngs.push(map.getProjection().fromPointToLatLng(this.pointB))
        return latLngs
    }
    print(name = ''){
        console.log(`line ${name}: (${this.pointA.x},${this.pointA.y}) to (${this.pointB.x},${this.pointB.y})`)
    }
    getSlope(){
        //return (this.pointB.y - this.pointA.y)/(this.pointB.x - this.pointA.x)
        return Math.tan(this.getAngle()*Math.PI/180)
    }
    getIntercept(){
        return this.pointA.y - this.getSlope()*this.pointA.x
    }    
  }

  class Polygon{
      constructor(points){
        this.points = points
      }

    setPointsFromLatLng(latLngs){
        this.points = []
        for (var i =0; i<latLngs.getLength();i++){
            const latLng = latLngs.getAt(i)
            let pt = map.getProjection().fromLatLngToPoint(latLng)
            this.points.push( new Point(pt.x,pt.y))
        }
        return this
    }
    
     getLatLng(){
        let latLngs = []
        for (var i =0; i<this.points.length;i++){
            const xy = this.points[i]
            latLngs.push(map.getProjection().fromPointToLatLng(xy))
        }
        return latLngs
    }
    getLongestEdge(){  
        let edgeList = this.getEdgeList()
        return edgeList.reduce((max,cur)=>max.getLength()>cur.getLength()?max:cur, edgeList[0])
    }
    getAngle(a, b, c){
        const pointA = this.getPointAt(a) 
        const pointB = this.getPointAt(b) 
        const pointC = this.getPointAt(c) 
        const dxAB = pointA.x - pointB.x
        const dyAB = pointA.y - pointB.y
        const dxBC = pointC.x - pointB.x
        const dyBC = pointC.y - pointB.y
        const angle = Math.atan2(dxAB * dyBC - dyAB * dxBC, dxAB * dxBC + dyAB * dyBC);
        return angle
    
    }
    getAngles(){
        let angles = []
        const len = this.points.length
        for(let i=0; i < len; i++){        
        let angle = this.getAngle ( i-1, i, i+1 )
            angles.push(angle)
        }
        return angles
    }
    
    draw(){
        const rectLatLngs = this.getLatLng()
        const rectPoly = new google.maps.Polygon({
            paths: rectLatLngs,
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 0.5,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
        })
        rectPoly.setMap(map);
    }
    getPointAt(index){
        const len = this.points.length
        return this.points[(index+len)%len]
    }

    print(name =''){
        console.log(`polygon ${name}, len: ${this.points.length}`)
        for(let pt of this.points){
            pt.print()
        }
    }

    getSweepLine(){
        let line = this.getLongestEdge()
        
        let rays = this.points.map(x => new Ray(x, Math.tan((line.getAngle()+90)*Math.PI/180) ))
        let sweeps = rays.map(x => new Line( x.getIntersectPoint(line), x.point ) )
        let maxSweep = sweeps.reduce((max, cur)=> max.getLength() > cur.getLength()? max : cur, sweeps[0])
        // let maxPt = line.getFurthestPoint(this.points)
        // let sweep = new Line(line.getClosestPoint(maxPt), maxPt)
        return maxSweep
    }
    getEdgeList(){
        let edgeList = []
        for(let i = 0; i < this.points.length; i++){
            edgeList.push( new Line(this.getPointAt(i), this.getPointAt(i+1)))
        }
        return edgeList
    }
    getRayIntersectLine(ray){
        let edgeList = this.getEdgeList()
        //let intersectEdgeList = edgeList.filter(x=>ray.doesIntersect(x))
        let intersectingPoints = edgeList.map(x=>ray.getIntersectPoint(x,true))//true
        let nonNull = intersectingPoints.filter(x=>Boolean(x))
        console.log(intersectingPoints)
        console.log(nonNull)
        if(nonNull.length == 2){
            return new Line( nonNull[0], nonNull[1])
        }
        else{
            console.log(`ERROR: ray intersects at ${nonNull.length} points`)
            return null
        }
    }
}
// Polygon.prototype.toString = function PolyToString() {
//     return `points are ${Array(this.points)}`;
//   };
class Rectangle extends Polygon{
    constructor(point, width, height){
        let rect = []
        rect.push( new Point(point.x, point.y))
        rect.push( new Point(point.x, point.y + height))
        rect.push( new Point(point.x + width, point.y + height))
        rect.push( new Point(point.x + width, point.y))
        super(rect)
    }
}
function main(){
    let boundingPolygon = new Polygon([
        new Point(60, 90), 
        new Point(50, 95), 
        new Point(70, 95)])


    boundingPolygon.print()
    boundingPolygon.draw()

    let line = boundingPolygon.getLongestEdge()
    let sweep = boundingPolygon.getSweepLine()
    sweep.print('sweep')
    sweep.draw()
    console.log(`sweep angle is : ${sweep.getAngle()}`)
    console.log(`longestEdge angle is : ${line.getAngle()}`)
    let intervals = sweep.getIntervalPoints(10)    
    
    line.draw()
    const raySlope = Math.tan((sweep.getAngle()+90)*Math.PI/180)
    console.log(`ray angle is : ${Math.atan(raySlope)*180/Math.PI}`)
    let rays = intervals.map(x=>new Ray(x, raySlope))
    console.log(rays)
    let rayLines = rays.map(x=>boundingPolygon.getRayIntersectLine(x))
    console.log(rayLines)
    rayLines.forEach(x=>x.draw())
    
}