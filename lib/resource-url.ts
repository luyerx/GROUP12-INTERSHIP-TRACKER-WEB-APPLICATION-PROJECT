import { isIP } from "node:net";

// Resource links are public web pages. Reject IP literals and local-only names.
export function isPublicResourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      && !isIP(host) && !host.includes(":") && host.includes(".")
      && !/(^|\.)(localhost|local|internal|lan|home|test|invalid)$/.test(host)
      && !/(^|\.)example\.(com|net|org)$/.test(host);
  } catch { return false; }
}

export function validResourceLink(resource: { status: string; url: string }): boolean {
  return resource.url === "" ? resource.status === "Draft" : isPublicResourceUrl(resource.url);
}
