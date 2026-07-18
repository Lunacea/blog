import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { refreshPreview } from "../../scripts/refresh-link-previews.ts";

const image = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9">' +
  '<rect width="16" height="9" fill="currentColor"/></svg>';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    ),
  );
});

describe("link preview refresh", () => {
  it("prefers OGP metadata, resolves relative images, and writes a local WebP", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/cover.png")) {
        return Promise.resolve(
          new Response(image, {
            headers: { "content-type": "image/svg+xml" },
          }),
        );
      }
      return Promise.resolve(
        new Response(
          "<html><head><title>Fallback</title>" +
            '<meta property="og:title" content="OG title">' +
            '<meta property="og:description" content="OG description">' +
            '<meta property="og:image" content="/cover.png"></head></html>',
          { headers: { "content-type": "text/html" } },
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const directory = await mkdtemp(join(tmpdir(), "lunacea-link-preview-"));
    temporaryDirectories.push(directory);
    const preview = await refreshPreview(
      "https://example.com/article",
      undefined,
      true,
      new URL("./", pathToFileURL(join(directory, "placeholder"))),
    );

    expect(preview.title).toBe("OG title");
    expect(preview.description).toBe("OG description");
    expect(preview.image).toMatch(/^\/images\/ogp\/external\/.+\.webp$/u);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await readdir(directory)).toHaveLength(1);
  });

  it("rejects private hosts before fetching", async () => {
    await expect(refreshPreview("http://127.0.0.1/article")).rejects.toThrow(/Private/u);
  });
});
