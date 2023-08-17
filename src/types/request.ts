export interface Request {
    method: string
    params: string[] | object[]
    result?: any
    start: Date
    end?: Date
}