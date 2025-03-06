import { PropertiesService } from 'gasmask';
global.PropertiesService = PropertiesService;
import {normalizePersonName} from "../src/main/people";

describe("normalizePersonName", () => {
    it("should allow empty", () => {
        expect(normalizePersonName("")).toEqual("");
    });
    it("should make lowercase", () => {
        expect(normalizePersonName("HUDSON TAYLOR")).toEqual("hudson taylor");
    });
    it("should remove extra whitespace", () => {
        expect(normalizePersonName("  adoniram   judson  ")).toEqual("adoniram judson");
    });
    it("should remove parentheses", () => {
        expect(normalizePersonName("brian (jun) lin (sd)")).toEqual("brian lin");
    });
    it("should not remove middle names", () => {
        expect(normalizePersonName("jonathan koby cayaban")).toEqual("jonathan koby cayaban");
    });
    it("should remove word 'staff'", () => {
        expect(normalizePersonName("hg1 staff")).toEqual("hg1");
    });
});