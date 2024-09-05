import { assignBaseCampTasks, updateManualTriggerMenuUiOnOneStop } from "./menu";

export const startOneStopBaseCampIntegration = () => {
    updateManualTriggerMenuUiOnOneStop();
    assignBaseCampTasks();
    //TODO: Add remaining functions here
}