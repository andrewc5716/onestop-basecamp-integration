import { fetchWithRetry } from "../src/main/retry";
import {
  createLabelIfNotExists,
  clearTodoistTasks,
  createTodoistTask,
} from "../src";

const TODOIST_API_BASE_URL = "https://api.todoist.com/rest/v2";
const TODOIST_LABEL_NAME = "OnestopIntegration";
jest.mock("../src/main/retry", () => ({
  fetchWithRetry: jest.fn(),
}));

describe("Todoist API Integration", () => {
  const mockToken = "test-token";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createLabelIfNotExists", () => {
    it("should create the label if it does not exist", () => {
      // Mock response: no labels exist
      (fetchWithRetry as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/labels")) {
          return {
            getContentText: () =>
              JSON.stringify([
                { id: "123", name: "OtherLabel", color: "red", order: 1, is_favorite: false },
              ]),
          };
        }
      });

      createLabelIfNotExists(mockToken);

      expect(fetchWithRetry).toHaveBeenCalledTimes(2); // GET and POST
      expect(fetchWithRetry).toHaveBeenCalledWith(`${TODOIST_API_BASE_URL}/labels`, expect.objectContaining({ method: "get" }));
      expect(fetchWithRetry).toHaveBeenCalledWith(`${TODOIST_API_BASE_URL}/labels`, expect.objectContaining({ method: "post" }));
    });

    it("should not create the label if it already exists", () => {
      // Mock response: label exists
      (fetchWithRetry as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/labels")) {
          return {
            getContentText: () =>
              JSON.stringify([
                { id: "123", name: TODOIST_LABEL_NAME, color: "red", order: 1, is_favorite: false },
              ]),
          };
        }
      });

      createLabelIfNotExists(mockToken);

      expect(fetchWithRetry).toHaveBeenCalledTimes(1); // Only GET
      expect(fetchWithRetry).toHaveBeenCalledWith(`${TODOIST_API_BASE_URL}/labels`, expect.objectContaining({ method: "get" }));
    });
  });

  describe("clearTodoistTasks", () => {
    it("should delete all tasks with the integration label", () => {
      // Mock createLabelIfNotExists
      (fetchWithRetry as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/labels")) {
          return {
            getContentText: () =>
              JSON.stringify([
                { id: "123", name: TODOIST_LABEL_NAME, color: "red", order: 1, is_favorite: false },
              ]),
          };
        } else if (url.includes("/tasks")) {
          return {
            getContentText: () =>
              JSON.stringify([
                { id: "456", labels: [TODOIST_LABEL_NAME], content: "Task 1", is_completed: false },
                { id: "789", labels: ["OtherLabel"], content: "Task 2", is_completed: false },
              ]),
          };
        }
      });

      clearTodoistTasks(mockToken);

      expect(fetchWithRetry).toHaveBeenCalledWith(`${TODOIST_API_BASE_URL}/tasks/456`, expect.objectContaining({ method: "delete" }));
      expect(fetchWithRetry).toHaveBeenCalledTimes(3); // 1 GET for labels, 1 GET for tasks, 1 DELETE
    });

    it("should do nothing if no tasks have the integration label", () => {
      // Mock response: no tasks with the label
      (fetchWithRetry as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/labels")) {
          return {
            getContentText: () =>
              JSON.stringify([
                {id: "123", name: TODOIST_LABEL_NAME, color: "red", order: 1, is_favorite: false},
              ]),
          };
        }
        else if (url.includes("/tasks")) {
          return {
            getContentText: () =>
              JSON.stringify([
                { id: "456", labels: ["OtherLabel"], content: "Task 1", is_completed: false },
              ]),
          };
        }
      });

      clearTodoistTasks(mockToken);

      expect(fetchWithRetry).not.toHaveBeenCalledWith(expect.stringContaining("/tasks/"), expect.objectContaining({ method: "delete" }));
    });
  });

  describe("createTodoistTask", () => {
    it("should create a new task with the correct payload", () => {
      const mockTitle = "New Task";
      const mockDescription = "Task description";
      const mockDatetime = "2025-02-08T12:00:00Z";

      createTodoistTask(mockToken, mockTitle, mockDescription, mockDatetime);

      expect(fetchWithRetry).toHaveBeenCalledWith(`${TODOIST_API_BASE_URL}/tasks`, {
        method: "post",
        headers: {
          Authorization: `Bearer ${mockToken}`,
          "Content-Type": "application/json",
        },
        payload: JSON.stringify({
          content: mockTitle,
          description: mockDescription,
          due_datetime: mockDatetime,
          labels: [TODOIST_LABEL_NAME],
        }),
      });
    });
  });
});
