declare interface BasecampTodo {
    content: string,
    description: string,
    assignee_ids: number[],
    completion_subscriber_ids: number[],
    notify: boolean,
    due_on: Date,
    starts_on: Date
}

declare interface Row {
    readonly metadata: Metadata,
    readonly startTime: Date,
    readonly endTime: Date,
    readonly who: string,
    readonly numAttendees: number,
    readonly what: Text,
    readonly where: Text,
    readonly inCharge: Text,
    readonly helpers: Text,
    readonly foodLead: Text,
    readonly childcare: Text,
    readonly notes: Text
}

export function getBasecampPersonIds(names: string[]): number[] {
    return names.map(name => getBasecampPersonId(name));
}

export function getBasecampPersonId(name: string): number {
    // Implement logic for getting a person id
    return 1049715927
}

export function addLeadTodo(leadAssigneeId: number, row: Row, basecampTodos: BasecampTodo[]): void {
    basecampTodos.push({
        content: `Lead ${row.what.value}`,
        description: `Where: ${row.where.value}\nIn Charge: ${row.inCharge.value}\nHelpers: ${row.helpers.value}\nFood Lead: ${row.foodLead.value}}\nChildcare: ${row.childcare.value}\nNotes: ${row.notes.value}`,
        assignee_ids: [leadAssigneeId],
        completion_subscriber_ids: [],
        notify: true,
        due_on: row.endTime,
        starts_on: row.startTime
    })
}

export function addHelperTodo(helperAssigneeIds: number[], row: Row, basecampTodos: BasecampTodo[]): void {
    basecampTodos.push({
        content: `Help with ${row.what.value}`,
        description: `Where: ${row.where.value}\nIn Charge: ${row.inCharge.value}\nHelpers: ${row.helpers.value}\nFood Lead: ${row.foodLead.value}}\nChildcare: ${row.childcare.value}\nNotes: ${row.notes.value}`,
        assignee_ids: helperAssigneeIds,
        completion_subscriber_ids: [],
        notify: true,
        due_on: row.endTime,
        starts_on: row.startTime
    })
}

export function extractBasecampTodosFromRow(row: Row): BasecampTodo[] {
    
    let basecampTodos: BasecampTodo[] = [];

    const leadAssigneeId: number = getBasecampPersonId(row.inCharge.value);
    const helperAssigneeIds: number[] = getBasecampPersonIds(row.helpers.value.split(','))

    addLeadTodo(leadAssigneeId, row, basecampTodos);
    addHelperTodo(helperAssigneeIds, row, basecampTodos);

    return basecampTodos;
}