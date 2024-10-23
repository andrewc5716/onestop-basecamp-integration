import randomstring from "randomstring";

export function getRandomlyGeneratedMetadata(): Metadata {
    return {
        getId: jest.fn(),
        getKey: jest.fn(),
        getLocation: jest.fn(),
        getValue: jest.fn(),
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
}

export function getRandomlyGeneratedRow(): Row {
    return {
        metadata: getRandomlyGeneratedMetadata(),
        startTime: new Date(),
        endTime: new Date(),
        who: randomstring.generate(),
        numAttendees: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
        what: getRandomlyGeneratedText(),
        where: getRandomlyGeneratedText(),
        inCharge: getRandomlyGeneratedText(),
        helpers: getRandomlyGeneratedText(),
        foodLead: getRandomlyGeneratedText(),
        childcare: getRandomlyGeneratedText(),
        notes: getRandomlyGeneratedText()
    }
}

function getRandomlyGeneratedText(): Text {
    return {
        value: randomstring.generate(),
        hyperlink: randomstring.generate()
    }
}
