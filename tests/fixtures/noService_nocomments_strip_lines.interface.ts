

export namespace Routeguide {

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