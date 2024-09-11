import { BasecampTodo } from "./models/basecampTodo";
import { HelperGroup, Person } from "./models/helpers";
//import { getPersonId } from "./getPersonId";

// Waiting for Isaac's implementation
export function getPersonId(name: string): number {
    // Implement logic for getting a person id
    return 1049715927
}

export function filterInvalidNames(names: string): string[] {
    return names.split(',').map(name => name.trim()).filter(name => name !== '');
}

export function associateBasecampIdsWithNames(names: string[]) {
    return names.map( name => ({ name: name, basecampId: getPersonId(name) }));
}

export function parseHelpersAndRoles(line: string, forChildcare: boolean = false): HelperGroup {

    let filteredNames = [];
    let helperRole = '';

    if (line.includes(':')) {

        const [role, names] = line.split(':');

        if (role && names) {
            helperRole = role;
            filteredNames = filterInvalidNames(names);

        } else {
            throw new Error("Helpers with roles detected but the formatting for either the roles or helper names is invalid!")
        }
        
    } else {

        filteredNames = filterInvalidNames(line);
    }

    const helpers: Person[] = associateBasecampIdsWithNames(filteredNames);

    return new HelperGroup(helperRole, helpers, forChildcare);
}

export function constructToDoContent(role: string, isChildcare: boolean, what: string) {

    if(isChildcare) {
        return (role !== '' && role !== 'Helpers') ? `Help with ${role.toLowerCase()} for childcare during ${what}` : `Help with childcare during ${what}`;

    } else {
        return role !== '' ? `Help with ${role.toLowerCase()} for ${what}` : `Help with ${what}`;
    }
}

export function constructTodoDescription(row: Row) {

    const location = `WHERE: ${row.where.value ?? "N\\A"}`;
    const inCharge = `\n\nIN CHARAGE: ${row.inCharge.value ?? "N\\A"}`;
    const helpers = `\n\nHELPERS: ${row.helpers.value ?? "N\\A"}`;
    const foodLead = `\n\nFOOD LEAD: ${row.foodLead.value ?? "N\\A"}`;
    const childcare = `\n\nCHILDCARE: ${row.childcare.value ?? "N\\A"}`;
    const notes = `\n\nNOTES: ${row.notes.value ?? "N\\A"}`;
    
    return location + inCharge + helpers + foodLead + childcare + notes;
}

export function collectAllHelperGroups(row: Row): HelperGroup[] {
    
}

export function extractHelperTodos(row: Row): BasecampTodo[] {

    const basecampTodos: BasecampTodo[] = [];

    const allHelpers: HelperGroup[] = [];
    
    const eventRolesAndHelpers = row.helpers.value.split('\n');

    eventRolesAndHelpers.forEach( line => {
        allHelpers.push(parseHelpersAndRoles(line));
    });

    const childcareRolesAndHelpers = row.childcare.value.split('\n');

    childcareRolesAndHelpers.forEach( line => {
        allHelpers.push(parseHelpersAndRoles(line))
    })

    allHelpers.forEach( helpers => {
        basecampTodos.push({
            content: constructToDoContent(helpers.role, helpers.isChildcare, row.what.value),
            description: constructTodoDescription(row),
            assignee_ids: helpers.getBaseCampIds(),
            completion_subscriber_ids: [],
            notify: true,
            due_on: row.endTime,
            starts_on: row.startTime
        })
    })

    return basecampTodos;
}

export function extractBasecampTodosFromRow(row: Row): BasecampTodo[] {
    
    let basecampTodos: BasecampTodo[] = [];

    extractHelperTodos(row);

    return basecampTodos;
}