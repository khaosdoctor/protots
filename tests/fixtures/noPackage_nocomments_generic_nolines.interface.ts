import Stream from 'ts-stream'

export interface RouteGuideService {
getFeature (point: Point): Feature
listFeatures (rectangle: Rectangle): Stream<Feature>
recordRoute (pointStream: Stream<Point>): RouteSummary
routeChat (routeNoteStream: Stream<RouteNote>): Stream<RouteNote>
}
export interface Point {
latitude?: number
longitude?: number
}
export interface Rectangle {
lo: Point
hi?: Point
}
export interface Feature {
name?: string
location?: Point
}
export interface RouteNote {
location?: Point
message?: string[]
}
export interface RouteSummary {
pointCount?: number
featureCount?: number
distance?: number
elapsedTime?: number
}
}