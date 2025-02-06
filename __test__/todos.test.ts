import { Logger } from "gasmask";
global.Logger = Logger;
import { getRandomlyGeneratedRoleRequestMap, Mock } from "./testUtils";
import randomstring from "randomstring";

describe("createTodo", () => {

});

describe("updateTodo", () => {

});

describe("deleteTodo", () => {

});

describe("getBasecampTodoRequest", () => {

});

describe("createNewTodos", () => {
    it("should create new todos for each role when there are no errors when making requests to basecamp", () => {
        const roleRequestMapMock: RoleRequestMap = getRandomlyGeneratedRoleRequestMap();

        const sendBasecampPostRequestMock: Mock = jest.fn().mockReturnValue({ id: randomstring.generate() });
        jest.mock("../src/main/basecamp", () => ({
            sendBasecampPostRequest: sendBasecampPostRequestMock,
            getBasecampProjectUrl: jest.fn(() => randomstring.generate()),
        }));

        const { createNewTodos } = require("../src/main/todos");

        const receivedRoleTodoMap: RoleTodoMap = createNewTodos(roleRequestMapMock);

        expect(Object.keys(receivedRoleTodoMap)).toHaveLength(Object.keys(roleRequestMapMock).length);
    });

    it("should return an empty map when all requests to basecamp fail", () => {
        const roleRequestMapMock: RoleRequestMap = getRandomlyGeneratedRoleRequestMap();

        const sendBasecampPostRequestMock: Mock = jest.fn().mockImplementation(() => {
            throw new Error("Error");
        });
        jest.mock("../src/main/basecamp", () => ({
            sendBasecampPostRequest: sendBasecampPostRequestMock,
            getBasecampProjectUrl: jest.fn(() => randomstring.generate()),
        }));

        const { createNewTodos } = require("../src/main/todos");

        const receivedRoleTodoMap: RoleTodoMap = createNewTodos(roleRequestMapMock);

        expect(Object.keys(receivedRoleTodoMap)).toHaveLength(0);
    });
});

describe("deleteTodos", () => {

});

describe("deleteObsoleteTodos", () => {

});

describe("getObsoleteTodosIds", () => {

});

describe("updateTodosForExistingRoles", () => {

});

describe("createTodosForNewRoles", () => {

});
