export interface request {
    method: string
    params: string[] | object[]
    result?: any
    start: Date
    end?: Date
}