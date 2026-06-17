declare module 'next/server' {
  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse
    static redirect(url: string, init?: number | ResponseInit): NextResponse
    static next(): NextResponse
  }
}
