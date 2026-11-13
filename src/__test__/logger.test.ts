import { parseFeed, setPartytimeLogger, setPartytimeLogLevel, type PartytimeLogger } from "../core";

function createLoggerSpySink(): PartytimeLogger & {
  trace: jest.Mock;
  debug: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
} {
  return {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

describe("portable logger controls", () => {
  let warnSpy:
    | jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>
    | undefined;

  afterEach(() => {
    setPartytimeLogger(null);
    setPartytimeLogLevel("warn");
    if (warnSpy) {
      warnSpy.mockRestore();
      warnSpy = undefined;
    }
  });

  it("routes invalid feed warnings to a custom sink", () => {
    const sink = createLoggerSpySink();

    setPartytimeLogger(sink);
    parseFeed("<rss");

    expect(sink.warn.mock.calls.some(([firstArg]) => firstArg === "invalid feed")).toBe(true);
  });

  it("silences console warns at silent level and restores warn level output", () => {
    setPartytimeLogger(null);
    setPartytimeLogLevel("silent");
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    parseFeed("<rss");
    expect(warnSpy).not.toHaveBeenCalled();

    setPartytimeLogLevel("warn");
    parseFeed("<rss");
    expect(warnSpy).toHaveBeenCalled();
  });
});
