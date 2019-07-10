


export interface RouteGuideService {
getFeature (point: Point): Feature

listFeatures (rectangle: Rectangle): Feature

recordRoute (point: Point): RouteSummary

routeChat (routeNote: RouteNote): RouteNote
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