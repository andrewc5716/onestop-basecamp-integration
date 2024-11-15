import randomstring from "randomstring";

const BOOLEAN_UPPERBOUND: number = 2;

export type Mock = jest.Mock;

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
        numAttendees: getRandomNumber(),
        what: getRandomlyGeneratedText(),
        where: getRandomlyGeneratedText(),
        inCharge: getRandomlyGeneratedText(),
        helpers: getRandomlyGeneratedText(),
        foodLead: getRandomlyGeneratedText(),
        childcare: getRandomlyGeneratedText(),
        notes: getRandomlyGeneratedText()
    }
}

export function getRandomlyGeneratedRange(): Range {
    return {
        activate: jest.fn().mockReturnThis(),
        activateAsCurrentCell: jest.fn().mockReturnThis(),
        addDeveloperMetadata: jest.fn().mockReturnThis(),
        applyColumnBanding: jest.fn().mockReturnValue({}),
        applyRowBanding: jest.fn().mockReturnValue({}),
        autoFill: jest.fn(),
        autoFillToNeighbor: jest.fn(),
        breakApart: jest.fn().mockReturnThis(),
        canEdit: jest.fn().mockReturnValue(true),
        check: jest.fn().mockReturnThis(),
        clear: jest.fn().mockReturnThis(),
        clearContent: jest.fn().mockReturnThis(),
        clearDataValidations: jest.fn().mockReturnThis(),
        clearFormat: jest.fn().mockReturnThis(),
        clearNote: jest.fn().mockReturnThis(),
        collapseGroups: jest.fn().mockReturnThis(),
        copyFormatToRange: jest.fn(),
        copyTo: jest.fn(),
        copyValuesToRange: jest.fn(),
        createDataSourcePivotTable: jest.fn().mockReturnValue({}),
        createDataSourceTable: jest.fn().mockReturnValue({}),
        createDeveloperMetadataFinder: jest.fn().mockReturnValue({}),
        createFilter: jest.fn().mockReturnValue({}),
        createPivotTable: jest.fn().mockReturnValue({}),
        createTextFinder: jest.fn().mockReturnValue({}),
        deleteCells: jest.fn(),
        expandGroups: jest.fn().mockReturnThis(),
        getA1Notation: jest.fn().mockReturnValue(randomstring.generate()),
        getBackground: jest.fn().mockReturnValue(randomstring.generate()),
        getBackgroundObject: jest.fn().mockReturnValue({}),
        getBackgroundObjects: jest.fn().mockReturnValue([[]]),
        getBackgrounds: jest.fn().mockReturnValue([[]]),
        getBandings: jest.fn().mockReturnValue([]),
        getCell: jest.fn().mockReturnThis(),
        getColumn: jest.fn().mockReturnValue(1),
        getDataRegion: jest.fn().mockReturnThis(),
        getDataSourceFormula: jest.fn().mockReturnValue({}),
        getDataSourceFormulas: jest.fn().mockReturnValue([]),
        getDataSourcePivotTables: jest.fn().mockReturnValue([]),
        getDataSourceTables: jest.fn().mockReturnValue([]),
        getDataSourceUrl: jest.fn().mockReturnValue(randomstring.generate()),
        getDataTable: jest.fn().mockReturnValue({}),
        getDataValidation: jest.fn().mockReturnValue(null),
        getDataValidations: jest.fn().mockReturnValue([[]]),
        getDeveloperMetadata: jest.fn().mockReturnValue([]),
        getDisplayValue: jest.fn().mockReturnValue(randomstring.generate()),
        getDisplayValues: jest.fn().mockReturnValue([[]]),
        getFilter: jest.fn().mockReturnValue(null),
        getFontColor: jest.fn().mockReturnValue(randomstring.generate()),
        getFontColors: jest.fn().mockReturnValue([[]]),
        getFontColorObject: jest.fn().mockReturnValue({}),
        getFontColorObjects: jest.fn().mockReturnValue([[]]),
        getFontFamilies: jest.fn().mockReturnValue([[]]),
        getFontFamily: jest.fn().mockReturnValue(randomstring.generate()),
        getFontLine: jest.fn().mockReturnValue(randomstring.generate()),
        getFontLines: jest.fn().mockReturnValue([[]]),
        getFontSize: jest.fn().mockReturnValue(10),
        getFontSizes: jest.fn().mockReturnValue([[]]),
        getFontStyle: jest.fn().mockReturnValue(randomstring.generate()),
        getFontStyles: jest.fn().mockReturnValue([[]]),
        getFontWeight: jest.fn().mockReturnValue(randomstring.generate()),
        getFontWeights: jest.fn().mockReturnValue([[]]),
        getFormula: jest.fn().mockReturnValue(randomstring.generate()),
        getFormulaR1C1: jest.fn().mockReturnValue(null),
        getFormulas: jest.fn().mockReturnValue([[]]),
        getFormulasR1C1: jest.fn().mockReturnValue([[]]),
        getGridId: jest.fn().mockReturnValue(getRandomNumber()),
        getHeight: jest.fn().mockReturnValue(getRandomNumber()),
        getHorizontalAlignment: jest.fn().mockReturnValue(randomstring.generate()),
        getHorizontalAlignments: jest.fn().mockReturnValue([[]]),
        getLastColumn: jest.fn().mockReturnValue(getRandomNumber()),
        getLastRow: jest.fn().mockReturnValue(getRandomNumber()),
        getMergedRanges: jest.fn().mockReturnValue([]),
        getNextDataCell: jest.fn().mockReturnThis(),
        getNote: jest.fn().mockReturnValue(randomstring.generate()),
        getNotes: jest.fn().mockReturnValue([[]]),
        getNumColumns: jest.fn().mockReturnValue(getRandomNumber()),
        getNumRows: jest.fn().mockReturnValue(getRandomNumber()),
        getNumberFormat: jest.fn().mockReturnValue(randomstring.generate()),
        getNumberFormats: jest.fn().mockReturnValue([[]]),
        getRichTextValue: jest.fn().mockReturnValue(null),
        getRichTextValues: jest.fn().mockReturnValue([[]]),
        getRow: jest.fn().mockReturnValue(getRandomNumber()),
        getRowIndex: jest.fn().mockReturnValue(getRandomNumber()),
        getSheet: jest.fn().mockReturnValue({}),
        getTextDirection: jest.fn().mockReturnValue(null),
        getTextDirections: jest.fn().mockReturnValue([[]]),
        getTextRotation: jest.fn().mockReturnValue({}),
        getTextRotations: jest.fn().mockReturnValue([[]]),
        getTextStyle: jest.fn().mockReturnValue({}),
        getTextStyles: jest.fn().mockReturnValue([[]]),
        getValue: jest.fn().mockReturnValue(''),
        getValues: jest.fn().mockReturnValue([[]]),
        getVerticalAlignment: jest.fn().mockReturnValue(randomstring.generate()),
        getVerticalAlignments: jest.fn().mockReturnValue([[]]),
        getWidth: jest.fn().mockReturnValue(getRandomNumber()),
        getWrap: jest.fn().mockReturnValue(getRandomBoolean()),
        getWrapStrategies: jest.fn().mockReturnValue([[]]),
        getWrapStrategy: jest.fn().mockReturnValue({}),
        getWraps: jest.fn().mockReturnValue([[]]),
        insertCells: jest.fn().mockReturnThis(),
        insertCheckboxes: jest.fn().mockReturnThis(),
        isBlank: jest.fn().mockReturnValue(getRandomBoolean()),
        isChecked: jest.fn().mockReturnValue(getRandomBoolean()),
        isEndColumnBounded: jest.fn().mockReturnValue(getRandomBoolean()),
        isEndRowBounded: jest.fn().mockReturnValue(getRandomBoolean()),
        isPartOfMerge: jest.fn().mockReturnValue(getRandomBoolean()),
        isStartColumnBounded: jest.fn().mockReturnValue(getRandomBoolean()),
        isStartRowBounded: jest.fn().mockReturnValue(getRandomBoolean()),
        merge: jest.fn().mockReturnThis(),
        mergeAcross: jest.fn().mockReturnThis(),
        mergeVertically: jest.fn().mockReturnThis(),
        moveTo: jest.fn(),
        offset: jest.fn().mockReturnThis(),
        protect: jest.fn().mockReturnValue({}),
        randomize: jest.fn().mockReturnThis(),
        removeCheckboxes: jest.fn().mockReturnThis(),
        removeDuplicates: jest.fn().mockReturnThis(),
        setBackground: jest.fn().mockReturnThis(),
        setBackgroundObject: jest.fn().mockReturnThis(),
        setBackgroundObjects: jest.fn().mockReturnThis(),
        setBackgroundRGB: jest.fn().mockReturnThis(),
        setBackgrounds: jest.fn().mockReturnThis(),
        setBorder: jest.fn().mockReturnThis(),
        setDataValidation: jest.fn().mockReturnThis(),
        setDataValidations: jest.fn().mockReturnThis(),
        setFontColor: jest.fn().mockReturnThis(),
        setFontColorObject: jest.fn().mockReturnThis(),
        setFontColorObjects: jest.fn().mockReturnThis(),
        setFontColors: jest.fn().mockReturnThis(),
        setFontFamilies: jest.fn().mockReturnThis(),
        setFontFamily: jest.fn().mockReturnThis(),
        setFontLine: jest.fn().mockReturnThis(),
        setFontLines: jest.fn().mockReturnThis(),
        setFontSize: jest.fn().mockReturnThis(),
        setFontSizes: jest.fn().mockReturnThis(),
        setFontStyle: jest.fn().mockReturnThis(),
        setFontStyles: jest.fn().mockReturnThis(),
        setFontWeight: jest.fn().mockReturnThis(),
        setFontWeights: jest.fn().mockReturnThis(),
        setFormula: jest.fn().mockReturnThis(),
        setFormulaR1C1: jest.fn().mockReturnThis(),
        setFormulas: jest.fn().mockReturnThis(),
        setFormulasR1C1: jest.fn().mockReturnThis(),
        setHorizontalAlignment: jest.fn().mockReturnThis(),
        setHorizontalAlignments: jest.fn().mockReturnThis(),
        setNote: jest.fn().mockReturnThis(),
        setNotes: jest.fn().mockReturnThis(),
        setNumberFormat: jest.fn().mockReturnThis(),
        setNumberFormats: jest.fn().mockReturnThis(),
        setRichTextValue: jest.fn().mockReturnThis(),
        setRichTextValues: jest.fn().mockReturnThis(),
        setShowHyperlink: jest.fn().mockReturnThis(),
        setTextDirection: jest.fn().mockReturnThis(),
        setTextDirections: jest.fn().mockReturnThis(),
        setTextRotation: jest.fn().mockReturnThis(),
        setTextRotations: jest.fn().mockReturnThis(),
        setTextStyle: jest.fn().mockReturnThis(),
        setTextStyles: jest.fn().mockReturnThis(),
        setValue: jest.fn().mockReturnThis(),
        setValues: jest.fn().mockReturnThis(),
        setVerticalAlignment: jest.fn().mockReturnThis(),
        setVerticalAlignments: jest.fn().mockReturnThis(),
        setVerticalText: jest.fn().mockReturnThis(),
        setWrap: jest.fn().mockReturnThis(),
        setWrapStrategies: jest.fn().mockReturnThis(),
        setWrapStrategy: jest.fn().mockReturnThis(),
        setWraps: jest.fn().mockReturnThis(),
        shiftColumnGroupDepth: jest.fn().mockReturnThis(),
        shiftRowGroupDepth: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        splitTextToColumns: jest.fn(),
        trimWhitespace: jest.fn().mockReturnThis(),
        uncheck: jest.fn().mockReturnThis(),
    };
}

export function getRandomlyGeneratedMember(): Member {
    return {
        name: randomstring.generate(),
        gender: randomstring.generate(),
        married: getRandomBoolean(),
        parent: getRandomBoolean(),
        class: getRandomNumber(),
    };
}

export function getRandomlyGeneratedMemberMap(numMembers: number = 10): MemberMap {
    const memberMap: MemberMap = {};
    for(let i = 0; i < numMembers; i++) {
        const member: Member = getRandomlyGeneratedMember();
        memberMap[member.name] = member;
    }

    return memberMap;
}

function getRandomlyGeneratedMemberRow(numAlternateNames: number = 3): any[] {
    return [randomstring.generate(), randomstring.generate(), getRandomBoolean(), getRandomBoolean(), getRandomNumber(), Array.from({length: numAlternateNames}, () => randomstring.generate()).join(",")];
}

export function getRandomlyGeneratedMemberTable(numMembers: number = 10, numAlternateNames: number = 3): any[][] {
    const memberTable: any[][] = [["Name", "Gender", "Married", "Parent", "Class", "Alertnate Names (comma separated)"]];
    for(let i = 0; i < numMembers; i++) {
        memberTable.push(getRandomlyGeneratedMemberRow(numAlternateNames));
    }

    return memberTable;
}

export function getRandomlyGeneratedAliasMap(numAliases: number = 10): AliasMap {
    const aliasMap: AliasMap = {};
    for(let i = 0; i < numAliases; i++) {
        const members: string[] = Array.from({length: numAliases}, () => randomstring.generate());
        aliasMap[randomstring.generate()] = members;
    }
    
    return aliasMap;
}

function getRandomlyGeneratedAliasRow(numAliases: number = 3): any[] {
    return [randomstring.generate(), randomstring.generate(), Array.from({length: numAliases}, () => randomstring.generate()).join(",")];
}

export function getRandomlyGeneratedAliasTable(numCoupleAliases: number = 10): any[][] {
    const aliasTable: any[][] = [["Husband", "Wife", "Couple Aliases"]];
    for(let i = 0; i < numCoupleAliases; i++) {
        aliasTable.push(getRandomlyGeneratedAliasRow());
    }

    return aliasTable;
}

export function getRandomlyGeneratedSheet(): Sheet {
    return {
        activate: jest.fn().mockReturnThis(),
        addDeveloperMetadata: jest.fn().mockReturnThis(),
        appendRow: jest.fn().mockReturnThis(),
        asDataSourceSheet: jest.fn().mockReturnValue(null),
        autoResizeColumn: jest.fn().mockReturnThis(),
        autoResizeColumns: jest.fn().mockReturnThis(),
        autoResizeRows: jest.fn().mockReturnThis(),
        clear: jest.fn().mockReturnThis(),
        clearConditionalFormatRules: jest.fn(),
        clearContents: jest.fn().mockReturnThis(),
        clearFormats: jest.fn().mockReturnThis(),
        clearNotes: jest.fn().mockReturnThis(),
        collapseAllColumnGroups: jest.fn().mockReturnThis(),
        collapseAllRowGroups: jest.fn().mockReturnThis(),
        copyTo: jest.fn().mockReturnThis(),
        createDeveloperMetadataFinder: jest.fn(),
        createTextFinder: jest.fn(),
        deleteColumn: jest.fn().mockReturnThis(),
        deleteColumns: jest.fn(),
        deleteRow: jest.fn().mockReturnThis(),
        deleteRows: jest.fn(),
        expandAllColumnGroups: jest.fn().mockReturnThis(),
        expandAllRowGroups: jest.fn().mockReturnThis(),
        expandColumnGroupsUpToDepth: jest.fn().mockReturnThis(),
        expandRowGroupsUpToDepth: jest.fn().mockReturnThis(),
        getActiveCell: jest.fn(),
        getActiveRange: jest.fn(),
        getActiveRangeList: jest.fn(),
        getBandings: jest.fn().mockReturnValue([]),
        getCharts: jest.fn().mockReturnValue([]),
        getColumnGroup: jest.fn(),
        getColumnGroupControlPosition: jest.fn(),
        getColumnGroupDepth: jest.fn().mockReturnValue(0),
        getColumnWidth: jest.fn().mockReturnValue(0),
        getConditionalFormatRules: jest.fn().mockReturnValue([]),
        getCurrentCell: jest.fn(),
        getDataRange: jest.fn(),
        getDataSourceTables: jest.fn().mockReturnValue([]),
        getDeveloperMetadata: jest.fn().mockReturnValue([]),
        getDrawings: jest.fn().mockReturnValue([]),
        getFilter: jest.fn(),
        getFormUrl: jest.fn(),
        getFrozenColumns: jest.fn().mockReturnValue(0),
        getFrozenRows: jest.fn().mockReturnValue(0),
        getImages: jest.fn().mockReturnValue([]),
        getIndex: jest.fn().mockReturnValue(0),
        getLastColumn: jest.fn().mockReturnValue(0),
        getLastRow: jest.fn().mockReturnValue(0),
        getMaxColumns: jest.fn().mockReturnValue(0),
        getMaxRows: jest.fn().mockReturnValue(0),
        getName: jest.fn().mockReturnValue(randomstring.generate()),
        getNamedRanges: jest.fn().mockReturnValue([]),
        getParent: jest.fn(),
        getPivotTables: jest.fn().mockReturnValue([]),
        getProtections: jest.fn().mockReturnValue([]),
        getRange: jest.fn(),
        getRangeList: jest.fn(),
        getRowGroup: jest.fn(),
        getRowGroupControlPosition: jest.fn(),
        getRowGroupDepth: jest.fn().mockReturnValue(0),
        getRowHeight: jest.fn().mockReturnValue(0),
        getSelection: jest.fn(),
        getSheetId: jest.fn().mockReturnValue(0),
        getSheetName: jest.fn().mockReturnValue(randomstring.generate()),
        getSheetValues: jest.fn().mockReturnValue([]),
        getSlicers: jest.fn().mockReturnValue([]),
        getTabColor: jest.fn(),
        getType: jest.fn(),
        hasHiddenGridlines: jest.fn().mockReturnValue(getRandomBoolean()),
        hideColumn: jest.fn(),
        hideColumns: jest.fn(),
        hideRow: jest.fn(),
        hideRows: jest.fn(),
        hideSheet: jest.fn().mockReturnThis(),
        insertChart: jest.fn(),
        insertColumnAfter: jest.fn().mockReturnThis(),
        insertColumnBefore: jest.fn().mockReturnThis(),
        insertColumns: jest.fn(),
        insertColumnsAfter: jest.fn().mockReturnThis(),
        insertColumnsBefore: jest.fn().mockReturnThis(),
        insertImage: jest.fn(),
        insertRowAfter: jest.fn().mockReturnThis(),
        insertRowBefore: jest.fn().mockReturnThis(),
        insertRows: jest.fn(),
        insertRowsAfter: jest.fn().mockReturnThis(),
        insertRowsBefore: jest.fn().mockReturnThis(),
        insertSlicer: jest.fn(),
        isColumnHiddenByUser: jest.fn().mockReturnValue(getRandomBoolean()),
        isRightToLeft: jest.fn().mockReturnValue(getRandomBoolean()),
        isRowHiddenByFilter: jest.fn().mockReturnValue(getRandomBoolean()),
        isRowHiddenByUser: jest.fn().mockReturnValue(getRandomBoolean()),
        isSheetHidden: jest.fn().mockReturnValue(getRandomBoolean()),
        moveColumns: jest.fn(),
        moveRows: jest.fn(),
        newChart: jest.fn(),
        protect: jest.fn(),
        removeChart: jest.fn(),
        setActiveRange: jest.fn(),
        setActiveRangeList: jest.fn(),
        setActiveSelection: jest.fn(),
        setColumnGroupControlPosition: jest.fn(),
        setColumnWidth: jest.fn().mockReturnThis(),
        setColumnWidths: jest.fn().mockReturnThis(),
        setConditionalFormatRules: jest.fn(),
        setCurrentCell: jest.fn(),
        setFrozenColumns: jest.fn(),
        setFrozenRows: jest.fn(),
        setHiddenGridlines: jest.fn(),
        setName: jest.fn(),
        setRightToLeft: jest.fn(),
        setRowGroupControlPosition: jest.fn(),
        setRowHeight: jest.fn().mockReturnThis(),
        setRowHeights: jest.fn().mockReturnThis(),
        setRowHeightsForced: jest.fn().mockReturnThis(),
        setTabColor: jest.fn(),
        showColumns: jest.fn(),
        showRows: jest.fn(),
        showSheet: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        unhideColumn: jest.fn(),
        unhideRow: jest.fn(),
        updateChart: jest.fn(),
        getSheetProtection: jest.fn(),
        setSheetProtection: jest.fn(),
    };
}

function getRandomlyGeneratedText(): Text {
    return {
        value: randomstring.generate(),
        hyperlink: randomstring.generate()
    }
}

function getRandomNumber(upperBound: number = Number.MAX_SAFE_INTEGER): number {
    return Math.floor(Math.random() * upperBound);
}

function getRandomBoolean(): boolean {
    return getRandomNumber(BOOLEAN_UPPERBOUND) ? true: false;
}
