import { test, expect } from "vitest";
import { render } from "@testing-library/vue";
import Breadcrumbs from "./Breadcrumbs.vue";

test("shows This PC when no folder has been selected", () => {
  const { getByText } = render(Breadcrumbs, { props: { trail: [] } });
  expect(getByText("This PC")).toBeTruthy();
});
