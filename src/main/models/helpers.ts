export declare interface Person {
    name: string,
    basecampId: number
}

export class HelperGroup {

    role: string;
    helpers: Person[];
    isChildcare: boolean;

    constructor(role: string, helpers: Person[], isChildcare: boolean) {
        this.role = role;
        this.helpers = helpers;
        this.isChildcare = isChildcare;
    }

    getBaseCampIds(): number[] {
        return this.helpers.map(helper => helper.basecampId);
    }
}