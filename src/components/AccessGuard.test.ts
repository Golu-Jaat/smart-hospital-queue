import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccessGuard } from "./AccessGuard";

describe("AccessGuard initial render", () => {
  it("keeps Proxy-authorized dashboard content mounted during verification", () => {
    const html = renderToStaticMarkup(
      createElement(AccessGuard, {
        requiredRole: "admin",
        children: createElement("p", null, "Admin overview"),
      }),
    );

    expect(html).toContain("Admin overview");
    expect(html).not.toContain("Loading portal");
  });
});
