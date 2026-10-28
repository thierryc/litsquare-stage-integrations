const DEFAULT_MCP_URL = "http://127.0.0.1:7460/mcp";
const PREFERRED_PROTOCOL_VERSION = "2025-11-25";

export class StageMCPClient {
  constructor({
    url = process.env.STAGE_MCP_URL ?? DEFAULT_MCP_URL,
    timeoutMs = 5000,
    clientName = "litsquare-stage-plugin",
    clientVersion = "0.9.6",
    fetchImpl = globalThis.fetch
  } = {}) {
    if (typeof fetchImpl !== "function") {
      throw new Error("LitSquare Stage MCP requires a Fetch API implementation.");
    }
    this.url = String(url);
    this.timeoutMs = timeoutMs;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
    this.fetchImpl = fetchImpl;
    this.protocolVersion = null;
    this.initializeResult = null;
    this.initializePromise = null;
    this.nextID = 1;
  }

  async initialize() {
    if (this.protocolVersion) {
      return this.protocolVersion;
    }
    if (!this.initializePromise) {
      this.initializePromise = this.#initializeOnce();
    }
    try {
      return await this.initializePromise;
    } catch (error) {
      this.initializePromise = null;
      throw error;
    }
  }

  async listTools() {
    return await this.request("tools/list", {});
  }

  async callTool(name, argumentsValue = {}, timeoutMs = this.timeoutMs) {
    const result = await this.request(
      "tools/call",
      { name, arguments: removeUndefined(argumentsValue) },
      timeoutMs
    );
    if (result?.isError) {
      const message = result.content?.find((entry) => entry?.type === "text")?.text;
      throw new Error(message ?? `LitSquare Stage MCP tool ${name} failed.`);
    }
    return result?.structuredContent ?? result;
  }

  async listResources() {
    return await this.request("resources/list", {});
  }

  async readResource(uri) {
    return await this.request("resources/read", { uri });
  }

  async request(method, params = {}, timeoutMs = this.timeoutMs) {
    if (method !== "initialize") {
      await this.initialize();
    }
    const response = await this.#send({
      jsonrpc: "2.0",
      id: `${Date.now()}-${this.nextID++}`,
      method,
      params
    }, timeoutMs, method === "initialize" ? null : this.protocolVersion);
    if (response?.error) {
      throw new Error(response.error.message ?? `MCP ${method} failed.`);
    }
    return response?.result;
  }

  async notify(method, params = {}, timeoutMs = this.timeoutMs) {
    await this.initialize();
    await this.#send({ jsonrpc: "2.0", method, params }, timeoutMs, this.protocolVersion, true);
  }

  async #initializeOnce() {
    const response = await this.#send({
      jsonrpc: "2.0",
      id: `${Date.now()}-${this.nextID++}`,
      method: "initialize",
      params: {
        protocolVersion: PREFERRED_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: {
          name: this.clientName,
          title: "LitSquare Stage Plugin",
          version: this.clientVersion
        }
      }
    }, this.timeoutMs, null);
    if (response?.error) {
      throw new Error(response.error.message ?? "LitSquare Stage MCP initialization failed.");
    }
    const version = response?.result?.protocolVersion;
    if (typeof version !== "string" || version.length === 0) {
      throw new Error("LitSquare Stage MCP returned no negotiated protocol version.");
    }
    this.initializeResult = response.result;
    this.protocolVersion = version;
    await this.#send(
      { jsonrpc: "2.0", method: "notifications/initialized", params: {} },
      this.timeoutMs,
      version,
      true
    );
    return version;
  }

  async #send(payload, timeoutMs, protocolVersion, acceptsEmpty = false) {
    const headers = {
      accept: "application/json, text/event-stream",
      "content-type": "application/json"
    };
    if (protocolVersion) {
      headers["mcp-protocol-version"] = protocolVersion;
    }
    const response = await fetchWithTimeout(
      this.fetchImpl,
      this.url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      },
      timeoutMs
    );
    const text = await response.text();
    if (!response.ok) {
      let message = `MCP ${payload.method} failed with HTTP ${response.status}.`;
      try {
        message = JSON.parse(text)?.error?.message ?? message;
      } catch {
        // Keep the HTTP error when the body is not JSON.
      }
      throw new Error(message);
    }
    if (!text) {
      if (acceptsEmpty || response.status === 202) {
        return null;
      }
      throw new Error(`MCP ${payload.method} returned an empty response.`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`MCP ${payload.method} returned invalid JSON.`);
    }
  }
}

export async function probeHealth(url, timeoutMs = 5000, fetchImpl = globalThis.fetch) {
  try {
    const response = await fetchWithTimeout(fetchImpl, String(url), { method: "GET" }, timeoutMs);
    return {
      ok: response.ok,
      status: response.status,
      body: await response.text()
    };
  } catch (error) {
    return { ok: false, status: null, error: errorMessage(error) };
  }
}

export function removeUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(removeUndefined);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, removeUndefined(entry)])
  );
}

export function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function fetchWithTimeout(fetchImpl, url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
