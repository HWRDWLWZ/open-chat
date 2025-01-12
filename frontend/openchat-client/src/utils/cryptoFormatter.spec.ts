import { formatTokens, validateTokenInput } from "./cryptoFormatter";

describe("crypto formatter", () => {
    describe("validate ICP input", () => {
        test("1", () => {
            const validated = validateTokenInput("1");
            expect(validated).toEqual({ replacementText: undefined, e8s: BigInt(100_000_000) });
        });

        test("1234.567890", () => {
            const validated = validateTokenInput("1234.567890");
            expect(validated).toEqual({ replacementText: undefined, e8s: BigInt(123_456_789_000) });
        });

        test("1234,567890 (using comma as decimal separator)", () => {
            const validated = validateTokenInput("1234,567890");
            expect(validated).toEqual({ replacementText: undefined, e8s: BigInt(123_456_789_000) });
        });

        test("1,234.567890 (invalid due to command and decimal)", () => {
            const validated = validateTokenInput("1,234.567890");
            expect(validated).toEqual({ replacementText: "", e8s: BigInt(0) });
        });

        test("0.12345678", () => {
            const validated = validateTokenInput("0.12345678");
            expect(validated).toEqual({ replacementText: undefined, e8s: BigInt(12_345_678) });
        });

        test("0.123456789", () => {
            const validated = validateTokenInput("0.123456789");
            expect(validated).toEqual({ replacementText: "0.12345678", e8s: BigInt(12_345_678) });
        });

        test("0.", () => {
            const validated = validateTokenInput("0.");
            expect(validated).toEqual({ replacementText: undefined, e8s: BigInt(0) });
        });

        test(".", () => {
            const validated = validateTokenInput(".");
            expect(validated).toEqual({ replacementText: undefined, e8s: BigInt(0) });
        });

        test(".0", () => {
            const validated = validateTokenInput(".0");
            expect(validated).toEqual({ replacementText: undefined, e8s: BigInt(0) });
        });

        test(".000", () => {
            const validated = validateTokenInput(".000");
            expect(validated).toEqual({ replacementText: undefined, e8s: BigInt(0) });
        });

        test("0.0", () => {
            const validated = validateTokenInput("0.0");
            expect(validated).toEqual({ replacementText: undefined, e8s: BigInt(0) });
        });

        test("all letters", () => {
            const validated = validateTokenInput("abc");
            expect(validated).toEqual({ replacementText: "", e8s: BigInt(0) });
        });

        test("numbers with a letter in the middle", () => {
            const validated = validateTokenInput("123a456.789");
            expect(validated).toEqual({ replacementText: "", e8s: BigInt(0) });
        });

        test("negative input", () => {
            const validated = validateTokenInput("-123");
            expect(validated).toEqual({ replacementText: "", e8s: BigInt(0) });
        });
    });

    describe("format", () => {
        test("1 ICP with min decimals = 4", () => {
            const formatted = formatTokens(BigInt(100_000_000), 4);
            expect(formatted).toEqual("1.0000");
        });

        test("1 ICP with min decimals = 0", () => {
            const formatted = formatTokens(BigInt(100_000_000), 0);
            expect(formatted).toEqual("1");
        });

        test("1.23456789 ICP with min decimals = 0", () => {
            const formatted = formatTokens(BigInt(123_456_789), 0);
            expect(formatted).toEqual("1.23456789");
        });

        test("123456789.12345678 ICP with min decimals = 2", () => {
            const formatted = formatTokens(BigInt(12_345_678_912_345_678), 0);
            expect(formatted).toEqual("123456789.12345678");
        });

        test("123456789.12345678 ICP with comma separator", () => {
            const formatted = formatTokens(BigInt(12_345_678_912_345_678), 0, ",");
            expect(formatted).toEqual("123456789,12345678");
        });
    });
});
