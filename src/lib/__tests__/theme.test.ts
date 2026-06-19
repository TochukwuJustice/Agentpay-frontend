import { effectiveTheme, readTheme, writeTheme } from "../theme";

const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe("theme helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockMatchMedia(false);
  });

  it("falls back to system when the stored value is missing or invalid", () => {
    expect(readTheme()).toBe("system");

    window.localStorage.setItem("agentpay.theme", "solarized");

    expect(readTheme()).toBe("system");
  });

  it("persists valid theme choices", () => {
    writeTheme("dark");

    expect(window.localStorage.getItem("agentpay.theme")).toBe("dark");
    expect(readTheme()).toBe("dark");
  });

  it("resolves explicit themes without consulting system preference", () => {
    mockMatchMedia(true);

    expect(effectiveTheme("light")).toBe("light");
    expect(effectiveTheme("dark")).toBe("dark");
  });

  it("resolves system theme from matchMedia", () => {
    mockMatchMedia(true);
    expect(effectiveTheme("system")).toBe("dark");

    mockMatchMedia(false);
    expect(effectiveTheme("system")).toBe("light");
  });
});