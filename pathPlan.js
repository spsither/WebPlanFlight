function generatePath() {
    
    const latLngs = selectedShape.getPath()
    let boundingPolygon = new Polygon().setPointsFromLatLng(latLngs)
    boundingPolygon.print('Selected Ares')
    //boundingPolygon.getLongestEdge().print('longest edge of bounding polygon')
    // const height = prompt(`Enter Drone Flight height:`)
    // console.log(height)
    let drone = new Drone(boundingPolygon, new Camera(78.8,4/3), 60)
    drone.pathPlan()
}

function degreeToRadian(x){
    return x * Math.PI / 180
}  
function radianToDegree(x){
    return x * 180 / Math.PI 
}  
class Camera{
    constructor(angleOfView, aspectRatio){
        this.angleOfView = angleOfView
        this.aspectRatio = aspectRatio
    }
    getFootPrintWidth(height){
        return 2*height*Math.tan(degreeToRadian(this.angleOfView/2))
    }
    getFootPrintHeight(height){
        return this.getFootPrintWidth(height)/this.aspectRatio
    }
}
class Drone{
    constructor(area, camera, height){
        this.area = area
        this.camera = camera
        this.height = height
    }
    pathPlan(){
        let sweep = this.area.getSweepLine()  
        //sweep.draw()  
        //console.log(sweep.getAngle())    
        let sweepLength = sweep.getLengthInMeters()
        let cameraWidth = this.camera.getFootPrintWidth(this.height)
        let cameraHeight = this.camera.getFootPrintHeight(this.height)
        let stripeCount = Math.ceil(sweepLength /cameraWidth)
        if(stripeCount % 2 != 0){
            stripeCount++
        }
        const stripeGap = (sweepLength - cameraWidth )/ (stripeCount - 1)
        let intervals = sweep.getIntervalPoints(stripeCount, cameraWidth/2, stripeGap) 

        const raySlope = Math.tan(degreeToRadian(sweep.getAngle()+90))
        let rays = intervals.map(x=>new Ray(x, raySlope))
        //rays.forEach(x=>x.draw())
        let plowLines = rays.map(x=>this.area.getRayIntersectLine(x))
        //plowLines.forEach(x=>x.draw())       
        let picturePoints = plowLines.map( x => {
            const plowLength = x.getLengthInMeters()
            const plowCount = Math.ceil(plowLength/cameraHeight)
            const plowGap = (plowLength - cameraHeight) / (plowCount - 1)
            return x.getIntervalPoints(plowCount,cameraHeight/2, plowGap)
        })
        let joinPicturePoints = []
        picturePoints.forEach((element,i) => {
            if(i%2 != 0)
                element.reverse()
            joinPicturePoints = joinPicturePoints.concat(element)
        });   
        console.log(`Number of way points: ${joinPicturePoints.length}`)
        let path = new Path(joinPicturePoints)
        path.draw()
        //new Rectangle(path.points[0], metersToLengthInPoints(cameraWidth), metersToLengthInPoints(cameraHeight), sweep.getAngle()).draw()
        path.points.forEach(x=> 
            new Rectangle(x, x.getProjectDistance(cameraWidth,90+sweep.getAngle()), x.getProjectDistance(cameraHeight,sweep.getAngle()), sweep.getAngle()).draw()
            )
    }
}
class Path{
    constructor(points){
        this.points = points
    }
    draw(myColor='#00FF00'){
        const flightPath = new google.maps.Polyline({
            path: this.getLatLng(),
            geodesic: true,
            strokeColor: myColor,
            strokeOpacity: 1.0,
            strokeWeight: 2,
        });
        flightPath.setMap(map);
      
    }
    getLatLng(){
        let latLngs = []
        for (var i =0; i<this.points.length;i++){
            const xy = this.points[i]
            latLngs.push(map.getProjection().fromPointToLatLng(xy))
        }
        return latLngs
    }
    writeFile(filename='path.csv'){
        for(let pt of this.points){

        }
    }
}
class Point{
    constructor(x,y){
        this.x = x
        this.y = y
    }
    print(name = ''){
        console.log(`point ${name}: (${this.x}, ${this.y})`)
    }
    getLatLng(){
        return map.getProjection().fromPointToLatLng(this)
    }
    getProjectDistance(meters, angle = 0){

        const latitude = this.getLatLng().lat()
        const longitude = this.getLatLng().lng()
    
        const r = 6371e3
    
        const dy = meters * Math.cos(degreeToRadian(angle))
        const dx = meters * Math.sin(degreeToRadian(angle))
        const new_latitude  = latitude  +  radianToDegree(dy / r);
        const new_longitude = longitude + radianToDegree(dx / r) / Math.cos( degreeToRadian( latitude))
    
        const pt1 = map.getProjection().fromLatLngToPoint(this.getLatLng())
        const pt2 = map.getProjection().fromLatLngToPoint({lat: ()=>new_latitude, lng: ()=>new_longitude})
    
        return new Line( new Point(pt1.x, pt1.y), new Point(pt2.x, pt2.y)).getLength()
        
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
        let inPt = this.getIntersectPoint(line,true)
        return Boolean(inPt)
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
            const a = new Line(this.point, line.pointA)
            const b = new Line(this.point, line.pointB)
            const n = this.getAngle() - 90
            const sign1 = Math.sign(Math.cos(degreeToRadian(a.getAngle() - n )))
            const sign2 = Math.sign(Math.cos(degreeToRadian(b.getAngle() - n )))
            if(sign1 != sign2){
                return ans
            }
            else{
                return null
            }
            
         } 
    }   
    getAngle(){
        return radianToDegree(Math.atan(this.slope))
    }
    draw(){
        const l = 0.001
        new Line(this.point, new Point( this.point.x + l * Math.cos(degreeToRadian(this.getAngle())) , this.point.y + l * Math.sin(degreeToRadian(this.getAngle())))).draw('#0000FF')
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
    getLengthInMeters(){
        let [ptA,ptB] = this.getLatLng()
        const lat1 = ptA.lat()
        const lon1 = ptA.lng()
        const lat2 = ptB.lat()
        const lon2 = ptB.lng()
        const R = 6371e3 // metres
        const φ1 = degreeToRadian( lat1 ) // φ, λ in radians
        const φ2 = degreeToRadian( lat2 )
        const Δφ = degreeToRadian(lat2-lat1)
        const Δλ = degreeToRadian(lon2-lon1)

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const d = R * c
        return d
        
    }
    getAngle(){
        return radianToDegree(Math.atan2(this.pointB.y - this.pointA.y, this.pointB.x - this.pointA.x))
    }

    getIntervalPoints(n, start, gap){     
        
        let intervalPoints = []
        
        const pTstart = this.pointA.getProjectDistance(start, this.getAngle())
        const startX = pTstart * Math.cos(degreeToRadian(this.getAngle()))
        const startY = pTstart * Math.sin(degreeToRadian(this.getAngle()))

        let st = new Point(this.pointA.x + startX, this.pointA.y + startY)
        intervalPoints.push(st)
        
        const pTgap = st.getProjectDistance(gap, this.getAngle())
        const strideX = pTgap * Math.cos(degreeToRadian(this.getAngle()))
        const strideY = pTgap * Math.sin(degreeToRadian(this.getAngle()))

        for(let i = 1; i < n; i++){
            let pt = new Point(st.x + strideX*i, st.y + strideY*i)
            intervalPoints.push(pt)
        }
        return intervalPoints

        // let intervalPoints = []
        
        // const strideX = this.getLength() * Math.cos(degreeToRadian(this.getAngle())) / n
        // const strideY = this.getLength() * Math.sin(degreeToRadian(this.getAngle())) / n
    
        // for(let i = 1; i < n; i++){
        //     let pt = new Point(this.pointA.x + strideX*i, this.pointA.y + strideY*i)
        //     intervalPoints.push(pt)
        // }
        // return intervalPoints

        
    }
    getDistanceToPoint(point){
        let d = Math.abs((this.pointB.x-this.pointA.x)*(this.pointA.y - point.y) - (this.pointA.x - point.x)*(this.pointB.y - this.pointA.y))
        return d/this.getLength()
    }
    draw(myColor = '#00FF00'){
          const flightPath = new google.maps.Polyline({
            path: this.getLatLng(),
            geodesic: true,
            strokeColor: myColor,
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
        return Math.tan(degreeToRadian(this.getAngle()))
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
        console.log(`${name} polygon with ${this.points.length} sides`)
        for(let pt of this.points){
            pt.print()
        }
    }

    getSweepLine(){
        let line = this.getLongestEdge()
        
        let rays = this.points.map(x => new Ray(x, Math.tan(degreeToRadian(line.getAngle()+90)) ))
        let sweeps = rays.map(x => new Line( x.getIntersectPoint(line), x.point ) )
        let maxSweep = sweeps.reduce((max, cur)=> max.getLength() > cur.getLength()? max : cur, sweeps[0])
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
        let intersectingPoints = edgeList.map(x=>ray.getIntersectPoint(x,true))//true here
        let nonNull = intersectingPoints.filter(x=>Boolean(x))
        // console.log(intersectingPoints)
        //console.log('intersects : '+nonNull)
        if(nonNull.length % 2 == 0 && nonNull.length >= 2){
            let minxPt = nonNull.reduce((min, cur)=>cur.x < min.x?cur:min)
            let maxxPt = nonNull.reduce((max, cur)=>max.x < cur.x?cur:max)
            return new Line( minxPt, maxxPt)
        }
        else{
            console.log(`ERROR: ray intersects at ${nonNull.length} points`)
            return null
        }
    }
}
Polygon.prototype.toString = function() {
    return `polygon points ${Array(this.points)}`;
  }
class Rectangle extends Polygon{
    constructor(center, width, height, angle=0){        
        let rect = []
        rect.push( new Point(center.x - width/2, center.y - height/2))
        rect.push( new Point(center.x - width/2, center.y + height/2))
        rect.push( new Point(center.x + width/2, center.y + height/2))
        rect.push( new Point(center.x + width/2, center.y - height/2))                                
        const origin = center
        const angleRad = degreeToRadian(angle)
        rect = rect.map(pt=>
            new Point( Math.cos(angleRad) * (pt.x - origin.x) - Math.sin(angleRad) * (pt.y - origin.y) + origin.x,
            Math.sin(angleRad) * (pt.x - origin.x) + Math.cos(angleRad) * (pt.y - origin.y) + origin.y)
        )                
        super(rect)
        this.center = center
    }
    rotate(angle) {
        const origin = this.center
        const angleRad = degreeToRadian(angle)
        this.points = this.points.map(pt=>
            new Point( Math.cos(angleRad) * (pt.x - origin.x) - Math.sin(angleRad) * (pt.y - origin.y) + origin.x,
            Math.sin(angleRad) * (pt.x - origin.x) + Math.cos(angleRad) * (pt.y - origin.y) + origin.y)
        )
        return this
    }
}
function main(){
    // let boundingPolygon = new Polygon([
    //     new Point(120, 120), 
    //     new Point(115, 125), 
    //     new Point(125, 125)])
    
    // boundingPolygon.draw()
    // new Ray(new Point(60,92),0).draw()
    // let drone = new Drone(boundingPolygon, new Camera(78.8,4/3), 50000)
    // drone.pathPlan()

    // let line = boundingPolygon.getLongestEdge()
    // let sweep = boundingPolygon.getSweepLine()
    // sweep.draw()
    // let intervals = sweep.getIntervalPoints(10)    
    
    // line.draw()
    // const raySlope = Math.tan(degreeToRadian(sweep.getAngle()+90))
    // let rays = intervals.map(x=>new Ray(x, raySlope))
    // let rayLines = rays.map(x=>boundingPolygon.getRayIntersectLine(x))
    // rayLines.forEach(x=>x.draw())
    
    // new Rectangle(new Point(0,0), 200,100).draw()
    // const X = 10
    // const Y = 10
    // let rect = new Rectangle(new Point(256/4*3,256/4*3),256/2,256/2)
    // rect.draw()
}