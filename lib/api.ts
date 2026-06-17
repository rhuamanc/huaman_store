import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, detail?: string) {
  return NextResponse.json({ error: message, detail }, { status });
}
