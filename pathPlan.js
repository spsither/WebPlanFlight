function generatePath() {
    
    const latLngs = selectedShape.getPath()
    var boundingPolygon = getPointsFromLatLng(latLngs)

    console.log(boundingPolygon)
    console.log(getLongestEdge(boundingPolygon))

}

function main(){
    var A = [{x: 65.6261234375, y: 94.89430580892719},
            {x: 65.6261234375, y: 94.98707924642717},
            {x: 65.82631875, y: 94.98707924642717},
            {x: 65.85756875, y: 94.89430580892719}]
    drawPoligon(A)
    var angles = getPoligonAngles(A)
    console.log(angles.map(x=>x*180/Math.PI))

    var longestEdge = getLongestEdge(A)
    console.log("longest edge is " + longestEdge)
}

function getLongestEdge(vertices){
    const len = vertices.length
    var maxLengthEdgeIndex
    var maxLength = 0;
    for(var i =0; i < vertices.length ; i++){
        var length = getLineLength( vertices [(i+len)%len], vertices [(i+1+len)%len])
        if(maxLength < length){
            maxLength = length
            maxLengthEdgeIndex = i
        }
    }
    return maxLengthEdgeIndex
}

function getLineLength(pointA, pointB){
    var dxAB = pointA.x - pointB.x
    var dyAB = pointA.y - pointB.y
    return Math.sqrt(dxAB**2+dyAB**2)
}
function getPoligonAngles(vertices){
    angles = []
    const len = vertices.length
    for(var i=0; i < len; i++){        
        var angle = getAngle ( vertices[(i-1+len)%len], vertices[(i+len)%len], vertices[(i+1 + len)%len])
        angles.push(angle)
    }
    return angles
}
function getLineAngle(pointA, pointB){
    var angle = Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x);
    return angle 
}
a = {x:1 , y: 0}
b = {x:0 , y: 0}
function getAngle(pointA, pointB, pointC){

    var dxAB = pointA.x - pointB.x
    var dyAB = pointA.y - pointB.y
    var dxBC = pointC.x - pointB.x
    var dyBC = pointC.y - pointB.y
    var angle = Math.atan2(dxAB * dyBC - dyAB * dxBC, dxAB * dxBC + dyAB * dyBC);
    return angle

}

function createRect(point,width,height){
    var rect = []
    rect.push({x:point.x + width * 0, y:point.y + height * 0})
    rect.push({x:point.x + width * 0, y:point.y + height * 1})
    rect.push({x:point.x + width * 1, y:point.y + height * 1})
    rect.push({x:point.x + width * 1, y:point.y + height * 0})
    return rect
}




function drawPoligon(rect){
    var rectLatLngs = getLatLngFromPoints(rect)
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

function getPointsFromLatLng(latLngs){
    points = []
    for (var i =0; i<latLngs.getLength();i++){
        const latLng = latLngs.getAt(i)
        points.push(map.getProjection().fromLatLngToPoint(latLng))
    }
    return points
}

function getLatLngFromPoints(points){
    latLngs = []
    for (var i =0; i<points.length;i++){
        const xy = points[i]
        latLngs.push(map.getProjection().fromPointToLatLng(xy))
    }
    return latLngs
}