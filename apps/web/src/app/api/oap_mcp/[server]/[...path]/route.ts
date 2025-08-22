import { NextRequest } from "next/server";
import { proxyMultiServerRequest } from "../../proxy-request";

export const runtime = "edge";

function extractParamsFromUrl(req: NextRequest) {
  const pathname = req.nextUrl?.pathname ?? new URL(req.url).pathname;
  const afterBase = pathname.replace(/^\/api\/oap_mcp\//, "");
  const segments = afterBase.split("/").filter(Boolean);
  const [server, ...path] = segments;
  return { server, path } as const;
}

export async function GET(req: NextRequest) {
  const { server, path } = extractParamsFromUrl(req);
  return proxyMultiServerRequest(req, { params: { server, path } });
}

export async function POST(req: NextRequest) {
  const { server, path } = extractParamsFromUrl(req);
  return proxyMultiServerRequest(req, { params: { server, path } });
}

export async function PUT(req: NextRequest) {
  const { server, path } = extractParamsFromUrl(req);
  return proxyMultiServerRequest(req, { params: { server, path } });
}

export async function PATCH(req: NextRequest) {
  const { server, path } = extractParamsFromUrl(req);
  return proxyMultiServerRequest(req, { params: { server, path } });
}

export async function DELETE(req: NextRequest) {
  const { server, path } = extractParamsFromUrl(req);
  return proxyMultiServerRequest(req, { params: { server, path } });
}

export async function HEAD(req: NextRequest) {
  const { server, path } = extractParamsFromUrl(req);
  return proxyMultiServerRequest(req, { params: { server, path } });
}

export async function OPTIONS(req: NextRequest) {
  const { server, path } = extractParamsFromUrl(req);
  return proxyMultiServerRequest(req, { params: { server, path } });
}
