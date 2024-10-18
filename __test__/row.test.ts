// Mock PropertiesService must be imported and set before the row module is imported
// and attempts to access the global PropertiesService object
import { PropertiesService } from 'gasmask';
global.PropertiesService = PropertiesService;

import { getId } from "../src/main/row";
import { RowMissingIdError } from '../src/main/error/rowMissingIdError';

describe("getId", () => {
  test("Row has an id", () => {
    const getValueMock = jest.fn(() => "0419f086-4f19-4ade-ac64-2edafefef23d");
    const metadataMock: Metadata = {
      getId: jest.fn(),
      getKey: jest.fn(),
      getLocation: jest.fn(),
      getValue: getValueMock,
      getVisibility: jest.fn(),
      moveToColumn: jest.fn().mockReturnThis(),
      moveToRow: jest.fn().mockReturnThis(),
      moveToSheet: jest.fn().mockReturnThis(),
      moveToSpreadsheet: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      setKey: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      setVisibility: jest.fn().mockReturnThis(),
    };
    const row: Row = {
      metadata: metadataMock,
      startTime: new Date("2024-10-18T07:00:00"),
      endTime: new Date("2024-10-18T08:00:00"),
      who: "Everyone",
      numAttendees: 100,
      what: {value: "DT + Prayer", hyperlink: null},
      where: {value: "Viewridge", hyperlink: null},
      inCharge: {value: "Person1", hyperlink: null},
      helpers: {value: "Setup: Helper1, Helper2, Helper3", hyperlink: null},
      foodLead: {value: "", hyperlink: null},
      childcare: {value: "", hyperlink: null},
      notes: {value: "", hyperlink: null}
    };

    const retrievedId: string = getId(row);

    expect(retrievedId).toBe("0419f086-4f19-4ade-ac64-2edafefef23d");
  });

  test("Row id is null", () => {
    const getValueMock = jest.fn(() => null);
    const metadataMock: Metadata = {
      getId: jest.fn(),
      getKey: jest.fn(),
      getLocation: jest.fn(),
      getValue: getValueMock,
      getVisibility: jest.fn(),
      moveToColumn: jest.fn().mockReturnThis(),
      moveToRow: jest.fn().mockReturnThis(),
      moveToSheet: jest.fn().mockReturnThis(),
      moveToSpreadsheet: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      setKey: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      setVisibility: jest.fn().mockReturnThis(),
    };
    const row: Row = {
      metadata: metadataMock,
      startTime: new Date("2024-10-18T07:00:00"),
      endTime: new Date("2024-10-18T08:00:00"),
      who: "Everyone",
      numAttendees: 100,
      what: {value: "DT + Prayer", hyperlink: null},
      where: {value: "Viewridge", hyperlink: null},
      inCharge: {value: "Person1", hyperlink: null},
      helpers: {value: "Setup: Helper1, Helper2, Helper3", hyperlink: null},
      foodLead: {value: "", hyperlink: null},
      childcare: {value: "", hyperlink: null},
      notes: {value: "", hyperlink: null}
    };

    expect(() => getId(row)).toThrow(RowMissingIdError);
  });

  test("Row id is an empty string", () => {
    const getValueMock = jest.fn(() => "");
    const metadataMock: Metadata = {
      getId: jest.fn(),
      getKey: jest.fn(),
      getLocation: jest.fn(),
      getValue: getValueMock,
      getVisibility: jest.fn(),
      moveToColumn: jest.fn().mockReturnThis(),
      moveToRow: jest.fn().mockReturnThis(),
      moveToSheet: jest.fn().mockReturnThis(),
      moveToSpreadsheet: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      setKey: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      setVisibility: jest.fn().mockReturnThis(),
    };
    const row: Row = {
      metadata: metadataMock,
      startTime: new Date("2024-10-18T07:00:00"),
      endTime: new Date("2024-10-18T08:00:00"),
      who: "Everyone",
      numAttendees: 100,
      what: {value: "DT + Prayer", hyperlink: null},
      where: {value: "Viewridge", hyperlink: null},
      inCharge: {value: "Person1", hyperlink: null},
      helpers: {value: "Setup: Helper1, Helper2, Helper3", hyperlink: null},
      foodLead: {value: "", hyperlink: null},
      childcare: {value: "", hyperlink: null},
      notes: {value: "", hyperlink: null}
    };

    expect(() => getId(row)).toThrow(RowMissingIdError);
  });
});
