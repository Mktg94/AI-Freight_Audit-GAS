declare module 'next/server' {
  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse
    static redirect(url: string, init?: number | ResponseInit): NextResponse
    static next(): NextResponse
  }
  export class NextRequest extends Request {
    nextUrl: URL
    cookies: any
    json(): Promise<any>
  }
}

declare module 'next/headers' {
  export function cookies(): {
    getAll(): { name: string; value: string }[]
    get(name: string): { name: string; value: string } | undefined
    set(name: string, value: string, options?: any): void
  }
}
